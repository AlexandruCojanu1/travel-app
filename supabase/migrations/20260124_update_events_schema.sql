alter table "public"."events" add column if not exists "business_id" uuid references "public"."businesses"("id");
alter table "public"."events" add column if not exists "facebook_event_url" text;
alter table "public"."events" add column if not exists "is_active" boolean default true;
alter table "public"."events" add column if not exists "location" text;
