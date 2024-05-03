create or replace function transfer_organization (org_id bigint, target_user_membership_id bigint)
  returns void
  security definer
  set search_path = public
  language PLPGSQL
  as $$
declare
  current_user_role int;
  current_user_membership_id int;
begin
  perform assert_service_role();

  select id, role from memberships
  where user_id = auth.uid() and
  organization_id = org_id
  into current_user_membership_id, current_user_role;

  if current_user_membership_id is null then
    raise exception 'User is not a member of the organization';
  end if;

  if current_user_role is null then
    raise exception 'User is not a member of the organization';
  end if;

  if current_user_role != 2 then
    raise exception 'Only owners can transfer organizations';
  end if;

  if current_user_membership_id = target_user_membership_id then
    raise exception 'Cannot transfer organization to yourself';
  end if;

  update
    memberships
  set
    role = 2
  where
    id = target_user_membership_id
    and organization_id = org_id;
  update
    memberships
  set
    role = 1
  where
    user_id = auth.uid ()
    and organization_id = org_id
    and id = current_user_membership_id;
end;
$$;