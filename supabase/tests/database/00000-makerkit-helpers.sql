create schema if not exists makerkit;

-- anon, authenticated, and service_role should have access to tests schema
grant USAGE on schema makerkit to anon, authenticated, service_role;

-- Don't allow public to execute any functions in the tests schema
alter default PRIVILEGES in schema makerkit revoke execute on FUNCTIONS from public;

-- Grant execute to anon, authenticated, and service_role for testing purposes
alter default PRIVILEGES in schema makerkit grant execute on FUNCTIONS to anon,
  authenticated, service_role;

create or replace function makerkit.create_db_user(user_id uuid)
  returns void
  as $$
begin
  insert into public.users(
    id,
    onboarded)
  values(
    user_id,
    true);

end;

$$
language PLPGSQL;

create or replace function makerkit.get_organization_id(org_name text)
  returns bigint
  as $$
declare
  organization_id bigint;
begin
  select
    id into organization_id
  from
    organizations
  where
    name = org_name
  limit 1;

  return organization_id;

end;

$$
language PLPGSQL;

create or replace function makerkit.get_membership_id(org_id bigint, uid uuid)
  returns bigint
  as $$
declare
  membership_id bigint;
begin
  select
    id into membership_id
  from
    memberships
  where
    user_id = uid
    and organization_id = org_id
  limit 1;

  return membership_id;

end;

$$
language PLPGSQL;

create or replace function makerkit.get_current_user_role(org_id bigint)
  returns int
  as $$
declare
  user_role int;
begin
  select
    role
  from
    memberships
  where
    organization_id = org_id
    and user_id = auth.uid() into user_role;

  if user_role is null then
    raise exception 'User is not a member of the organization';

  end if;

  return user_role;

end;

$$
language plpgsql;

create or replace function makerkit.get_active_subscription(org_id bigint)
  returns table(
    period_starts_at timestamptz,
    period_ends_at timestamptz,
    price_id text,
    "interval" text
  )
  as $$
begin
  return query
  select
    subscriptions.period_starts_at,
    subscriptions.period_ends_at,
    subscriptions.price_id,
    subscriptions."interval"
  from
    subscriptions
    join organizations_subscriptions on subscriptions.id =
      organizations_subscriptions.subscription_id
  where
    organizations_subscriptions.organization_id = org_id
    and(subscriptions.status = 'active'
      or subscriptions.status = 'trialing');

end;

$$
language plpgsql;

begin;

select
  no_plan();

select
  lives_ok($$
    select
      makerkit.get_organization_id('Supabase');

$$,
'can get organization id');

select
  *
from
  finish();

rollback;
