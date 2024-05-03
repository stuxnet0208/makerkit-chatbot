alter table "public"."organizations" add constraint "organizations_logo_url_check" CHECK ((length(logo_url) < 500)) not valid;

alter table "public"."organizations" validate constraint "organizations_logo_url_check";

alter table "public"."users" add constraint "users_photo_url_check" CHECK ((length(photo_url) < 500)) not valid;

alter table "public"."users" validate constraint "users_photo_url_check";


