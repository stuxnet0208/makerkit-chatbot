begin;

create extension "basejump-supabase_test_helpers" version '0.0.6';

select
  no_plan();

select
  tests.create_supabase_user('user');

select
  tests.create_supabase_user('user-2');

select
  tests.authenticate_as('user');

select
  create_new_organization('Organization');

select
  tests.authenticate_as('user-2');

select
  create_new_organization('Organization 2');

set local role postgres;

insert into subscriptions(
  id,
  price_id,
  status,
  cancel_at_period_end,
  currency,
  interval,
  interval_count,
  created_at,
  period_starts_at,
  period_ends_at,
  trial_starts_at,
  trial_ends_at)
values (
  'sub_123',
  'price_123',
  'active',
  false,
  'usd',
  'month',
  1,
  now(),
  now(),
  now() + interval '1 month',
  now(),
  now() + interval '1 month');

insert into organizations_subscriptions(
  organization_id,
  subscription_id,
  customer_id)
values (
  makerkit.get_organization_id(
    'Organization'),
  'sub_123',
  'cus_123');

create table _plans(
  id serial primary key not null,
  name text not null,
  price_id text not null,
  max_projects integer not null,
  max_storage bigint not null, -- in GB
  unique (price_id)
);

create table _projects(
  id serial primary key not null,
  organization_id bigint not null references organizations(id),
  name text not null
);

insert into _plans(
  id,
  name,
  price_id,
  max_projects,
  max_storage)
values (
  1,
  'Free',
  'price_123',
  1,
  1);

insert into _plans(
  id,
  name,
  price_id,
  max_projects,
  max_storage)
values (
  2,
  'Pro',
  'price_345',
  5,
  5);

alter table _plans enable row level security;

alter table _projects enable row level security;

create function get_projects_count(org_id bigint)
  returns integer
  as $$
  select
    count(*)
  from
    _projects
  where
      _projects.organization_id = org_id;
$$
language sql
stable;

create policy "Allow reading plans" on _plans
  for select to authenticated
    using (true);

create policy "Allow reading projects belonging to organization" on _projects
  for select to authenticated
    using (current_user_is_member_of_organization(organization_id));

-- the policy below can be used to allow inserting projects if the plan allows it
-- checking that
-- 1. the user is a member of the organization
-- 2. an active plan exists
-- 3. the plan allows inserting projects
-- 4. the user has not exceeded the number of projects allowed by the plan
create policy "Allow inserting projects if plan allows it" on _projects
  for insert to authenticated
    with check (
current_user_is_member_of_organization(
    organization_id)
    and (
      select
        max_projects
      from
        _plans
      where
        price_id =(
          select
            price_id
          from
	    makerkit.get_active_subscription(organization_id)))
	      >(get_projects_count(organization_id)));

select
  tests.authenticate_as('user');

-- can insert 1 project on the free plan
select
  lives_ok($$ insert into _projects(
      name, organization_id)
    values (
      'Project 1', makerkit.get_organization_id(
        'Organization'));

$$,
'can insert project');

-- cannot insert more than 1 project
select
  throws_ok($$ insert into _projects(
      name, organization_id)
    values (
      'Project 1', makerkit.get_organization_id(
        'Organization'));

$$,
'new row violates row-level security policy for table "_projects"');

select
  tests.authenticate_as('user-2');

select
  throws_ok($$ insert into _projects(
      name, organization_id)
    values (
      'Project 2', makerkit.get_organization_id(
        'Organization'));

$$,
'new row violates row-level security policy for table "_projects"');

select
  *
from
  finish();

rollback;
