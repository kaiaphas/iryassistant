alter type public.meal_type add value if not exists 'BREAKFAST';

comment on type public.meal_type is 'BREAKFAST=조식, LUNCH=중식, DINNER=석식';
