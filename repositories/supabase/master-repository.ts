import type { AdminUser, Driver, Guide, Hotel, Restaurant, RoomRate } from "@/lib/types";
import { adminUsers, drivers, guides, hotels, restaurants } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/repositories/supabase/reservation-repository";

type GuideRow = {
  id: string;
  name: string;
  phone: string | null;
  birth_date: string | null;
  bank_account: string | null;
  card_number?: string | null;
  assignable: boolean;
  active: boolean;
  available_weekday: boolean;
  available_weekend: boolean;
  memo: string | null;
};

type DriverRow = GuideRow & {
  capacity: string | null;
  company: string | null;
  driver_type: Driver["driverType"] | null;
};

type RestaurantRow = {
  id: string;
  tour_type?: Restaurant["tourType"] | null;
  product_name: string | null;
  region_name: string | null;
  shop_name: string;
  menu: string | null;
  retail_price: number | string | null;
  deposit_price: number | string | null;
  service_type: Restaurant["serviceType"] | null;
  phone: string | null;
  address: string | null;
  note: string | null;
};

type HotelRow = {
  id: string;
  region_name: string | null;
  shop_name: string;
  room_rates: Partial<Hotel["roomRates"]> | null;
  phone: string | null;
  address: string | null;
  note: string | null;
  driver_benefit: Hotel["driverBenefit"] | null;
  guide_benefit: Hotel["guideBenefit"] | null;
};

type AdminMemberRow = {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  role: string;
  department: string | null;
  phone: string | null;
  status: "pending" | "active" | "inactive";
  last_login_at: string | null;
  created_at: string;
};

const emptyRate: RoomRate = {
  weekday: 0,
  friday: 0,
  saturday: 0,
  peak: 0,
  breakfast: 0,
};

function isMissingTable(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? "";
  return (
    error?.code === "42P01"
    || error?.code === "PGRST205"
    || message.includes("does not exist")
    || message.includes("schema cache")
    || message.includes("Could not find the table")
  );
}

function numberValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value) || 0;
}

function textValue(value: string | null | undefined) {
  return value ?? "";
}

function mapGuide(row: GuideRow): Guide {
  return {
    id: row.id,
    name: row.name,
    phone: textValue(row.phone),
    birthDate: textValue(row.birth_date),
    bankAccount: textValue(row.bank_account),
    cardNumber: textValue(row.card_number),
    languages: [],
    regions: [],
    mainCourses: [],
    careerYears: 0,
    licenseStatus: "사용",
    assignable: row.assignable,
    active: row.active,
    availableWeekday: row.available_weekday,
    availableWeekend: row.available_weekend,
    memo: textValue(row.memo),
  };
}

function mapDriver(row: DriverRow): Driver {
  return {
    id: row.id,
    name: row.name,
    capacity: textValue(row.capacity),
    phone: textValue(row.phone),
    birthDate: textValue(row.birth_date),
    bankAccount: textValue(row.bank_account),
    company: textValue(row.company),
    driverType: row.driver_type ?? "직영",
    assignable: row.assignable,
    active: row.active,
    memo: textValue(row.memo),
  };
}

function mapRestaurant(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    tourType: row.tour_type === "당일" ? "당일" : "숙박",
    productName: textValue(row.product_name),
    regionName: textValue(row.region_name),
    shopName: row.shop_name,
    menu: textValue(row.menu),
    retailPrice: numberValue(row.retail_price),
    depositPrice: numberValue(row.deposit_price),
    serviceType: row.service_type ?? "없음",
    phone: textValue(row.phone),
    address: textValue(row.address),
    note: textValue(row.note),
  };
}

function normalizeRate(rate?: Partial<RoomRate>) {
  return {
    weekday: numberValue(rate?.weekday),
    friday: numberValue(rate?.friday),
    saturday: numberValue(rate?.saturday),
    peak: numberValue(rate?.peak),
    breakfast: numberValue(rate?.breakfast),
  };
}

function mapHotel(row: HotelRow): Hotel {
  const rates = row.room_rates ?? {};
  return {
    id: row.id,
    regionName: textValue(row.region_name),
    shopName: row.shop_name,
    roomRates: {
      double: normalizeRate(rates.double ?? emptyRate),
      triple: normalizeRate(rates.triple ?? emptyRate),
      quad: normalizeRate(rates.quad ?? emptyRate),
    },
    phone: textValue(row.phone),
    address: textValue(row.address),
    note: textValue(row.note),
    driverBenefit: row.driver_benefit ?? "미제공",
    guideBenefit: row.guide_benefit ?? "미제공",
  };
}

function mapAdminMember(row: AdminMemberRow): AdminUser {
  return {
    id: row.id,
    authUserId: row.auth_user_id ?? undefined,
    name: row.name,
    loginId: row.email,
    role: row.role,
    department: textValue(row.department),
    phone: textValue(row.phone),
    email: row.email,
    status: row.status,
    lastLoginAt: row.last_login_at?.slice(0, 10),
    createdAt: row.created_at.slice(0, 10),
  };
}

export async function findAdminMembersFromSupabase() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_members")
    .select("id,auth_user_id,name,email,role,department,phone,status,last_login_at,created_at")
    .order("created_at", { ascending: false });

  if (isMissingTable(error)) return adminUsers;
  if (error) throw new Error(`회원관리 Supabase 조회 실패: ${error.message}`);

  return ((data ?? []) as AdminMemberRow[]).map(mapAdminMember);
}

export async function updateAdminMemberStatus(id: string, status: AdminUser["status"], role?: string) {
  const supabase = createSupabaseServerClient();
  const payload = {
    status,
    ...(role ? { role } : {}),
    ...(status === "active" ? { approved_at: new Date().toISOString() } : {}),
  };
  const { data, error } = await supabase
    .from("admin_members")
    .update(payload)
    .eq("id", id)
    .select("id,auth_user_id,name,email,role,department,phone,status,last_login_at,created_at")
    .single();

  if (error) throw new Error(`회원 상태 변경 실패: ${error.message}`);
  return mapAdminMember(data as AdminMemberRow);
}

export async function updateAdminMember(member: Pick<AdminUser, "id" | "name" | "role" | "status"> & Partial<Pick<AdminUser, "department" | "phone">>) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_members")
    .update({
      name: member.name,
      role: member.role,
      status: member.status,
      department: member.department || null,
      phone: member.phone || null,
      ...(member.status === "active" ? { approved_at: new Date().toISOString() } : {}),
    })
    .eq("id", member.id)
    .select("id,auth_user_id,name,email,role,department,phone,status,last_login_at,created_at")
    .single();

  if (error) throw new Error(`회원 정보 저장 실패: ${error.message}`);
  return mapAdminMember(data as AdminMemberRow);
}

export async function findGuidesFromSupabase() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("master_guides")
    .select("id,name,phone,birth_date,bank_account,card_number,assignable,active,available_weekday,available_weekend,memo")
    .order("name", { ascending: true });

  if (isMissingTable(error)) return guides;
  if (error) throw new Error(`가이드관리 Supabase 조회 실패: ${error.message}`);

  return ((data ?? []) as GuideRow[]).map(mapGuide);
}

export async function findDriversFromSupabase() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("master_drivers")
    .select("id,name,capacity,phone,birth_date,bank_account,company,driver_type,assignable,active,memo")
    .order("name", { ascending: true });

  if (isMissingTable(error)) return drivers;
  if (error) throw new Error(`기사관리 Supabase 조회 실패: ${error.message}`);

  return ((data ?? []) as DriverRow[]).map(mapDriver);
}

export async function findRestaurantsFromSupabase() {
  const supabase = createSupabaseServerClient();
  let { data, error }: { data: RestaurantRow[] | null; error: { message?: string; code?: string } | null } = await supabase
    .from("master_restaurants")
    .select("id,tour_type,product_name,region_name,shop_name,menu,retail_price,deposit_price,service_type,phone,address,note")
    .order("region_name", { ascending: true })
    .order("shop_name", { ascending: true });

  if (error?.message?.includes("tour_type")) {
    const fallback = await supabase
      .from("master_restaurants")
      .select("id,product_name,region_name,shop_name,menu,retail_price,deposit_price,service_type,phone,address,note")
      .order("region_name", { ascending: true })
      .order("shop_name", { ascending: true });
    data = (fallback.data ?? null) as RestaurantRow[] | null;
    error = fallback.error;
  }

  if (isMissingTable(error)) return restaurants;
  if (error) throw new Error(`식당관리 Supabase 조회 실패: ${error.message}`);

  return ((data ?? []) as RestaurantRow[]).map(mapRestaurant);
}

export async function findHotelsFromSupabase() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("master_hotels")
    .select("id,region_name,shop_name,room_rates,phone,address,note,driver_benefit,guide_benefit")
    .order("region_name", { ascending: true })
    .order("shop_name", { ascending: true });

  if (isMissingTable(error)) return hotels;
  if (error) throw new Error(`호텔관리 Supabase 조회 실패: ${error.message}`);

  return ((data ?? []) as HotelRow[]).map(mapHotel);
}

export async function upsertGuideToSupabase(guide: Guide) {
  const supabase = createSupabaseServerClient();
  const payload = {
    ...(guide.id ? { id: guide.id } : {}),
    name: guide.name,
    phone: guide.phone || null,
    birth_date: guide.birthDate || null,
    bank_account: guide.bankAccount || null,
    card_number: guide.cardNumber || null,
    assignable: guide.assignable,
    active: guide.active,
    available_weekday: guide.availableWeekday,
    available_weekend: guide.availableWeekend,
    memo: guide.memo || null,
  };

  const { data, error } = await supabase.from("master_guides").upsert(payload).select("id,name,phone,birth_date,bank_account,card_number,assignable,active,available_weekday,available_weekend,memo").single();
  if (error) throw new Error(`가이드 저장 실패: ${error.message}`);
  return mapGuide(data as GuideRow);
}

export async function deleteGuideFromSupabase(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("master_guides").delete().eq("id", id);
  if (error) throw new Error(`가이드 삭제 실패: ${error.message}`);
}

export async function upsertDriverToSupabase(driver: Driver) {
  const supabase = createSupabaseServerClient();
  const payload = {
    ...(driver.id ? { id: driver.id } : {}),
    name: driver.name,
    capacity: driver.capacity || null,
    phone: driver.phone || null,
    birth_date: driver.birthDate || null,
    bank_account: driver.bankAccount || null,
    company: driver.company || null,
    driver_type: driver.driverType,
    assignable: driver.assignable,
    active: driver.active,
    memo: driver.memo || null,
  };

  const { data, error } = await supabase
    .from("master_drivers")
    .upsert(payload)
    .select("id,name,capacity,phone,birth_date,bank_account,company,driver_type,assignable,active,memo")
    .single();
  if (error) throw new Error(`기사 저장 실패: ${error.message}`);
  return mapDriver(data as DriverRow);
}

export async function deleteDriverFromSupabase(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("master_drivers").delete().eq("id", id);
  if (error) throw new Error(`기사 삭제 실패: ${error.message}`);
}

export async function upsertRestaurantToSupabase(restaurant: Restaurant) {
  const supabase = createSupabaseServerClient();
  const payload = {
    ...(restaurant.id ? { id: restaurant.id } : {}),
    tour_type: restaurant.tourType || "숙박",
    product_name: restaurant.productName || null,
    region_name: restaurant.regionName || null,
    shop_name: restaurant.shopName,
    menu: restaurant.menu || null,
    retail_price: restaurant.retailPrice || 0,
    deposit_price: restaurant.depositPrice || 0,
    service_type: restaurant.serviceType,
    phone: restaurant.phone || null,
    address: restaurant.address || null,
    note: restaurant.note || null,
  };

  let { data, error }: { data: RestaurantRow | null; error: { message?: string; code?: string } | null } = await supabase
    .from("master_restaurants")
    .upsert(payload)
    .select("id,tour_type,product_name,region_name,shop_name,menu,retail_price,deposit_price,service_type,phone,address,note")
    .single();

  if (error?.message?.includes("tour_type")) {
    const fallbackPayload = { ...payload } as Omit<typeof payload, "tour_type"> & { tour_type?: string };
    delete fallbackPayload.tour_type;
    const fallback = await supabase
      .from("master_restaurants")
      .upsert(fallbackPayload)
      .select("id,product_name,region_name,shop_name,menu,retail_price,deposit_price,service_type,phone,address,note")
      .single();
    data = (fallback.data ?? null) as RestaurantRow | null;
    error = fallback.error;
  }

  if (error) throw new Error(`식당 저장 실패: ${error.message}`);
  return mapRestaurant(data as RestaurantRow);
}

export async function deleteRestaurantFromSupabase(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("master_restaurants").delete().eq("id", id);
  if (error) throw new Error(`식당 삭제 실패: ${error.message}`);
}

export async function upsertHotelToSupabase(hotel: Hotel) {
  const supabase = createSupabaseServerClient();
  const payload = {
    ...(hotel.id ? { id: hotel.id } : {}),
    region_name: hotel.regionName || null,
    shop_name: hotel.shopName,
    room_rates: hotel.roomRates,
    phone: hotel.phone || null,
    address: hotel.address || null,
    note: hotel.note || null,
    driver_benefit: hotel.driverBenefit,
    guide_benefit: hotel.guideBenefit,
  };

  const { data, error } = await supabase
    .from("master_hotels")
    .upsert(payload)
    .select("id,region_name,shop_name,room_rates,phone,address,note,driver_benefit,guide_benefit")
    .single();
  if (error) throw new Error(`호텔 저장 실패: ${error.message}`);
  return mapHotel(data as HotelRow);
}

export async function deleteHotelFromSupabase(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("master_hotels").delete().eq("id", id);
  if (error) throw new Error(`호텔 삭제 실패: ${error.message}`);
}
