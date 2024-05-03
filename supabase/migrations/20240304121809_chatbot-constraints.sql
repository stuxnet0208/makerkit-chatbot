alter table "public"."chatbots" add constraint "chatbots_description_check" CHECK ((length(description) < 300)) not valid;

alter table "public"."chatbots" validate constraint "chatbots_description_check";

alter table "public"."chatbots" add constraint "chatbots_name_check" CHECK ((length(name) < 100)) not valid;

alter table "public"."chatbots" validate constraint "chatbots_name_check";

alter table "public"."chatbots" add constraint "chatbots_site_name_check" CHECK ((length(site_name) < 100)) not valid;

alter table "public"."chatbots" validate constraint "chatbots_site_name_check";

alter table "public"."chatbots" add constraint "chatbots_url_check" CHECK ((length(url) < 200)) not valid;

alter table "public"."chatbots" validate constraint "chatbots_url_check";

alter table "public"."conversations" add constraint "conversations_reference_id_check" CHECK ((length(reference_id) < 100)) not valid;

alter table "public"."conversations" validate constraint "conversations_reference_id_check";

alter table "public"."documents" add constraint "documents_content_check" CHECK ((length(content) < 5000)) not valid;

alter table "public"."documents" validate constraint "documents_content_check";

alter table "public"."messages" add constraint "messages_text_check" CHECK ((length(text) < 1000)) not valid;

alter table "public"."messages" validate constraint "messages_text_check";

alter table "public"."notifications" add constraint "notifications_body_check" CHECK ((length(body) < 100)) not valid;

alter table "public"."notifications" validate constraint "notifications_body_check";

alter table "public"."notifications" add constraint "notifications_entity_id_check" CHECK ((length(entity_id) < 100)) not valid;

alter table "public"."notifications" validate constraint "notifications_entity_id_check";

alter table "public"."notifications" add constraint "notifications_entity_type_check" CHECK ((length(entity_type) < 50)) not valid;

alter table "public"."notifications" validate constraint "notifications_entity_type_check";

alter table "public"."notifications" add constraint "notifications_link_check" CHECK ((length(link) < 100)) not valid;

alter table "public"."notifications" validate constraint "notifications_link_check";


