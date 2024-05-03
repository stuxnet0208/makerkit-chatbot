drop policy "Users can read the public data of users belonging to the same" on "public"."users";

create policy "Users can read the public data of users belonging to the same"
on "public"."users"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM memberships
  WHERE (users.id = memberships.user_id and memberships.organization_id IN ( SELECT get_organizations_for_authenticated_user() AS get_organizations_for_authenticated_user)))));