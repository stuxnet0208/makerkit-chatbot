-- force checking user is service role key
create or replace function assert_service_role()
  returns void
  as $$
begin
  if current_setting('role') != 'service_role' then
    raise exception 'authentication required';
  end if;
end;
$$
language plpgsql;

drop function create_new_organization;

create or replace function create_new_organization(org_name text, create_user
  boolean default true)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
  as $function$
declare
  organization bigint;
  uid uuid;
begin
  insert into organizations(
    "name")
  values (
    org_name)
returning
  id,
  uuid into organization,
  uid;

  if create_user then
    insert into users(
      id,
      onboarded)
    values (
      auth.uid(),
      true);
  end if;
  insert into memberships(
    user_id,
    organization_id,
    role)
  values (
    auth.uid(),
    organization,
    2);
  return uid;
end;
$function$;

revoke all on function create_new_organization from public, anon;

drop function accept_invite_to_organization;

create or replace function accept_invite_to_organization(invite_code text,
  invite_user_id uuid)
  returns json
  language PLPGSQL
  security definer
  set search_path = public
  as $$
declare
  organization bigint;
  membership bigint;
  target_role int;
begin
  if not exists (
    select
      1
    from
      users
    where
      id = invite_user_id) then
  insert into users(
    id,
    onboarded)
  values (
    invite_user_id,
    true);
end if;

  select
    "role"
  from
    memberships
  where
    code = invite_code into target_role;

  if target_role is null then
    raise exception 'Invite code not found';
  end if;

  if target_role = 2 then
    raise exception 'Owner cannot be invited';
  end if;

  update
    memberships
  set
    user_id = invite_user_id,
    code = null,
    invited_email = null
  where
    code = invite_code
  returning
    id,
    organization_id into membership,
    organization;
  return json_build_object('organization', organization, 'membership', membership);
end;
$$;

revoke all on function accept_invite_to_organization(text, uuid) from public,
  authenticated;

drop function transfer_organization;

create or replace function transfer_organization(org_id bigint,
  target_user_membership_id bigint)
  returns void
  security definer
  set search_path = public
  language PLPGSQL
  as $$
declare
  current_user_role int;
  current_user_membership_id bigint;
begin
  select
    id,
    role
  from
    memberships
  where (memberships.user_id = auth.uid()
    and memberships.organization_id = org_id) into current_user_membership_id,
  current_user_role;

  if current_user_role != 2 then
    raise exception 'Only owners can transfer organizations';
  end if;

  if current_user_membership_id = target_user_membership_id then
    raise exception 'Cannot transfer organization to yourself';
  end if;

  if not exists (
    select
      1
    from
      memberships
    where
      id = target_user_membership_id
      and organization_id = org_id) then
  raise exception 'Target user is not a member of this organization';
end if;

  update
    memberships
  set
    role = 1
  where
    memberships.id = current_user_membership_id
    and memberships.organization_id = org_id;

  update
    memberships
  set
    role = 2
  where
    memberships.id = target_user_membership_id
    and memberships.organization_id = org_id;
end;
$$;

revoke all on function transfer_organization(bigint, bigint) from public, anon;