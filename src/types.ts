export type SyncMode = "full" | "recent";

export type ImportBatchStatus = "PROCESSING" | "SUCCESS" | "FAILED" | "PARTIAL_FAILED";

export type TourType = "DAY" | "STAY";
export type ReservationWorkStatus = "BEFORE" | "COMPLETED" | "CANCELED";
export type ScheduleProgressStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELED";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";
export type RoomType = "DOUBLE" | "TRIPLE" | "QUAD";

export type MySqlScheduleRow = {
  source_schedule_key: string | number | null;
  order_no?: string | number | null;
  customer_name?: string | null;
  phone?: string | number | null;
  tour_date: string | Date | null;
  station?: string | null;
  reservation_status?: string | null;
  total_people?: number | string | null;
  adult?: number | string | null;
  child?: number | string | null;
  price?: number | string | null;
  payment_type?: string | null;
  payment_date?: string | Date | null;
  reservation_date?: string | Date | null;
  staff_name?: string | null;
  bus_no?: string | number | null;
  customer_message?: string | null;
  internal_memo?: string | null;
  tour_type?: string | null;
  product_code?: string | number | null;
  product_name: string | null;
  days?: number | string | null;
  nights?: number | string | null;
  departure_time?: string | null;
  return_time?: string | null;
  bus_info?: string | null;
  vehicle_no?: string | number | null;
  bus_company?: string | number | null;
  vehicle_capacity?: string | number | null;
  guide_name?: string | null;
  driver_name?: string | null;
  progress_status?: string | null;
  schedule_memo?: string | null;
  notice_memo?: string | null;
  reservation_count?: number | string | null;

  restaurant_bookings_json?: string | null;
  meal_type?: string | null;
  restaurant_name?: string | null;
  restaurant_phone?: string | number | null;
  restaurant_memo?: string | null;
  restaurant_status?: string | null;

  hotel_name?: string | null;
  hotel_phone?: string | number | null;
  hotel_memo?: string | null;
  hotel_status?: string | null;
  room_double_count?: number | string | null;
  room_triple_count?: number | string | null;
  room_quad_count?: number | string | null;

  updated_at?: string | Date | null;
};

export type NormalizedRestaurantBooking = {
  id: string;
  schedule_id: string;
  meal_type: MealType;
  restaurant_name: string;
  restaurant_phone: string | null;
  restaurant_memo: string | null;
  booking_status: ReservationWorkStatus;
  sort_order: number;
};

export type NormalizedHotelBooking = {
  id: string;
  schedule_id: string;
  hotel_name: string;
  hotel_phone: string | null;
  hotel_memo: string | null;
  booking_status: ReservationWorkStatus;
};

export type NormalizedRoomAssignment = {
  hotel_booking_id: string;
  room_type: RoomType;
  room_count: number;
};

export type NormalizedSchedule = {
  id: string;
  source_schedule_key: string;
  tour_date: string;
  tour_type: TourType;
  product_code: string | null;
  product_name: string;
  departure_time: string | null;
  return_time: string | null;
  vehicle_no: string | null;
  bus_company: string | null;
  vehicle_capacity: string | null;
  guide_name: string | null;
  driver_name: string | null;
  progress_status: ScheduleProgressStatus;
  memo: string | null;
  notice_memo: string | null;
  reservation_count: number;
  sort_order: number;
  is_active: boolean;
  restaurants: NormalizedRestaurantBooking[];
  hotel: NormalizedHotelBooking | null;
  rooms: NormalizedRoomAssignment[];
};

export type ImportBatchInsert = {
  id: string;
  file_name?: string | null;
  status: ImportBatchStatus;
  total_count?: number;
  success_count?: number;
  fail_count?: number;
  error_message?: string | null;
};

export type ImportBatchUpdate = {
  status: ImportBatchStatus;
  total_count?: number;
  success_count?: number;
  fail_count?: number;
  error_message?: string | null;
  finished_at?: string;
};

export type ValidationResult = {
  validRows: NormalizedSchedule[];
  invalidRows: Array<{
    row: MySqlScheduleRow;
    reason: string;
  }>;
};

export type ScheduleOverviewRow = {
  id: string;
  source_schedule_key: string | null;
  tour_date: string;
  tour_type_label: string;
  product_name: string;
  departure_time: string | null;
  return_time: string | null;
  vehicle_no: string | null;
  bus_company: string | null;
  vehicle_capacity: string | null;
  guide_name: string | null;
  driver_name: string | null;
  restaurant_names: string | null;
  hotel_name: string | null;
  room_assignments: string | null;
  progress_status_label: string;
  notice_memo: string | null;
  reservation_count: number | null;
};
