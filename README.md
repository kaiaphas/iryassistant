# irytour.com 일정 데이터 동기화 배치

외부 MySQL 데이터를 Supabase에서 직접 조회하지 않고, 로컬 또는 사내 서버에서 실행되는 Node.js 배치가 MySQL 일정 View를 조회해 CSV를 생성하고 Supabase 일정 중심 테이블에 적재합니다.

## 구조

1. MySQL `reservation_schedule_sync_view` 조회
2. `exports/reservation_schedules_YYYYMMDD_HHmmss.csv` 생성
3. Supabase `reservation_schedules` upsert
4. 일정별 `schedule_restaurant_bookings` 교체 insert
5. 일정별 `schedule_hotel_bookings`, `schedule_hotel_room_assignments` 교체 insert
6. 전체 동기화일 때 View에 없는 기존 일정 `is_active=false`
7. `import_batches` 로그 저장
8. 화면은 Supabase `reservation_schedule_overview` view 조회

## Supabase 테이블 생성

Supabase SQL Editor에서 [supabase/schema.sql](./supabase/schema.sql)을 실행합니다.

## MySQL View 생성

현재 코드가 조회하는 기본 View 이름은 `reservation_schedule_sync_view`입니다.

예시 View SQL 출력:

```bash
npm run print:mysql-view
```

출력된 SQL을 MySQL에서 실행하면 됩니다. 실제 운영 쿼리를 다시 작성하더라도 아래 alias는 유지해야 합니다.

```text
source_schedule_key
tour_date
tour_type
product_code
product_name
departure_time
return_time
vehicle_capacity
guide_name
driver_name
progress_status
schedule_memo
restaurant_bookings_json
meal_type
restaurant_name
restaurant_phone
restaurant_memo
restaurant_status
hotel_name
hotel_phone
hotel_memo
hotel_status
room_double_count
room_triple_count
room_quad_count
updated_at
```

숙박 일정에서 식당을 여러 개 넣어야 하면 `restaurant_bookings_json` 컬럼에 JSON 배열을 반환하면 됩니다.

```json
[
  {
    "meal_type": "LUNCH",
    "restaurant_name": "해안횟집",
    "restaurant_phone": "061-123-4567",
    "restaurant_memo": "단체 특식 요청",
    "restaurant_status": "COMPLETED"
  },
  {
    "meal_type": "DINNER",
    "restaurant_name": "자연밥상",
    "restaurant_phone": "061-222-3456",
    "restaurant_status": "BEFORE"
  }
]
```

`restaurant_bookings_json`이 없으면 `meal_type`, `restaurant_name`, `restaurant_phone`, `restaurant_memo`, `restaurant_status` 단일 식당 컬럼을 사용합니다.

## 환경변수

```bash
cp .env.example .env
```

`.env`에 값을 입력합니다.

```env
MYSQL_HOST=
MYSQL_PORT=3306
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=
MYSQL_SCHEDULE_VIEW=reservation_schedule_sync_view

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

BATCH_CHUNK_SIZE=500
```

`SUPABASE_SERVICE_ROLE_KEY`는 브라우저에 노출하면 안 되며, 이 배치 프로그램이 실행되는 로컬/사내 서버에서만 사용합니다.

## 설치

```bash
npm install
```

## 실행

CSV만 생성:

```bash
npm run export:csv
```

전체 동기화:

```bash
npm run sync
```

최근 1일 기준 부분 동기화:

```bash
npm run sync:recent
```

Supabase 적재 결과 조회:

```bash
npm run query:schedules
```

## 상태값

MySQL View에서는 영문 또는 한글 값을 모두 사용할 수 있습니다.

일정 구분:

```text
DAY / 당일
STAY / 숙박
```

식당/숙소 예약상태:

```text
BEFORE / 예약전
COMPLETED / 예약완료
CANCELED / 예약취소
```

일정 진행상태:

```text
IN_PROGRESS / 진행중
COMPLETED / 예약완료 / 확정
CANCELED / 예약취소 / 취소
```

식사 구분:

```text
LUNCH / 중식
DINNER / 석식
```

## cron 예시

매일 새벽 2시에 전체 동기화:

```cron
0 2 * * * cd /path/to/iryAssistant && /usr/local/bin/npm run sync >> logs/reservation-sync.log 2>&1
```

10분마다 최근 데이터 부분 동기화:

```cron
*/10 * * * * cd /path/to/iryAssistant && /usr/local/bin/npm run sync:recent >> logs/reservation-sync-recent.log 2>&1
```

## 운영 시 주의사항

- MySQL 계정은 일정 View에 대한 `SELECT` 권한만 부여합니다.
- `.env`는 절대 커밋하지 않습니다.
- 전체 동기화는 현재 View에 없는 기존 일정을 `is_active=false`로 바꿉니다.
- 부분 동기화는 비활성화 처리를 하지 않습니다.
- 당일 일정은 앱에서 식당 1개만 허용하고, 숙소 데이터는 적재하지 않습니다.
- 숙박 일정은 `restaurant_bookings_json`으로 중식/석식 등 여러 식당을 적재할 수 있습니다.
- `source_schedule_key`는 동일 일정의 고유키입니다. 이 값이 바뀌면 Supabase에서는 새 일정으로 인식됩니다.
