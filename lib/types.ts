export type Reservation = {
  orderId: string;
  customerName: string;
  phone: string;
  tourDate: string;
  station: string;
  reservationStatus: string;
  totalPeople: number;
  adult: number;
  child: number;
  price: number;
  paymentType: string;
  paymentDate?: string;
  reservationDate: string;
  staffName: string;
  busNo?: string;
  customerMessage?: string;
  internalMemo?: string;
  productName: string;
  departureTime?: string;
  returnTime?: string;
  busInfo?: string;
  busType?: string;
  driverName?: string;
  guideName?: string;
  hotelName?: string;
  hotelStatus?: string;
  restaurantName?: string;
  progressStatus?: string;
  dispatchMemo?: string;
};

export type ScheduleMasterRef = {
  id?: string;
  name: string;
  phone?: string;
};

export type FacilityBookingStatus = "예약전" | "예약완료" | "예약취소";

export type RestaurantBooking = {
  id: string;
  name: string;
  phone?: string;
  memo?: string;
  mealType: "중식" | "석식";
  status: FacilityBookingStatus;
};

export type HotelBooking = {
  name: string;
  phone?: string;
  rooms: {
    double: number;
    triple: number;
    quadruple: number;
  };
  status: FacilityBookingStatus;
};

export type ScheduleGroup = {
  id: string;
  tourType: "당일" | "숙박";
  tourDate: string;
  dayLabel: string;
  productCode: string;
  productName: string;
  departureTime: string;
  returnTime: string;
  busNo: string;
  vehicle: {
    id?: string;
    busInfo: string;
    busType: string;
    seatCount: number;
  };
  guide: ScheduleMasterRef;
  driver: ScheduleMasterRef;
  restaurant: ScheduleMasterRef;
  hotel?: ScheduleMasterRef;
  restaurantBookings: RestaurantBooking[];
  hotelBooking: HotelBooking;
  progressStatus: string;
  reservations: Reservation[];
  dispatchMemo?: string;
};

export type Guide = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  languages: string[];
  regions: string[];
  mainCourses: string[];
  careerYears: number;
  licenseStatus: string;
  assignable: boolean;
  active: boolean;
  memo?: string;
};

export type Driver = {
  id: string;
  name: string;
  capacity: string;
  phone: string;
  company: string;
  assignable: boolean;
  active: boolean;
  memo?: string;
};

export type Restaurant = {
  id: string;
  productName: string;
  regionName: string;
  shopName: string;
  menu: string;
  retailPrice: number;
  depositPrice: number;
  serviceType: "기사" | "가이드" | "기사+가이드" | "없음";
  phone: string;
  address: string;
  note?: string;
};

export type RoomRate = {
  weekday: number;
  friday: number;
  saturday: number;
  peak: number;
  breakfast: number;
};

export type Hotel = {
  id: string;
  regionName: string;
  shopName: string;
  roomRates: {
    double: RoomRate;
    triple: RoomRate;
    quad: RoomRate;
  };
  phone: string;
  address: string;
  note?: string;
  driverBenefit: "제공" | "부분할인" | "미제공";
  guideBenefit: "제공" | "부분할인" | "미제공";
};

export type Vehicle = {
  id: string;
  vehicleNo: string;
  busType: string;
  seatCount: number;
  driverName: string;
  driverPhone: string;
  insuranceExpireDate?: string;
  maintenanceDate?: string;
  operationStatus: string;
  active: boolean;
  memo?: string;
};

export type CodeItem = {
  id: string;
  group: string;
  value: string;
  label: string;
  description?: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type AdminUser = {
  id: string;
  name: string;
  loginId: string;
  role: string;
  department?: string;
  phone?: string;
  email?: string;
  status: "active" | "inactive";
  lastLoginAt?: string;
  createdAt: string;
};

export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};
