begin;

create extension "basejump-supabase_test_helpers" version '0.0.6';

select
  no_plan();

select
  tests.create_supabase_user('user');

select
  tests.create_supabase_user('user-2');

grant USAGE on schema tests to service_role;

select
  tests.authenticate_as('user');

select
  lives_ok($$
    select
      create_new_organization('Supabase');

$$);

select
  tests.authenticate_as('user-2');

select
  lives_ok($$
    select
      create_new_organization('Organization 2');

$$);

select
  tests.authenticate_as('user');

select
  is (makerkit.get_current_user_role(makerkit.get_organization_id('Supabase')),
    2);

select
  tests.authenticate_as('user-2');

select
  throws_ok($$
    select
      makerkit.get_current_user_role((
        select
          id
        from organizations
        where
          name = 'Supabase'));

$$,
'User is not a member of the organization');

select
  tests.authenticate_as('user');

set local role postgres;

insert into memberships(
  organization_id,
  user_id,
  role)
values (
  makerkit.get_organization_id(
    'Supabase'),
  tests.get_supabase_uid(
    'user-2'),
  1);

select
  tests.authenticate_as('user');

select
  is (can_update_user_role(makerkit.get_organization_id('Supabase'),
    makerkit.get_membership_id(makerkit.get_organization_id('Supabase'),
    tests.get_supabase_uid('user-2'))),
    true,
    'User can update role');

select
  tests.authenticate_as('user-2');

select
  is (can_update_user_role(makerkit.get_organization_id('Supabase'),
    makerkit.get_membership_id(makerkit.get_organization_id('Supabase'),
    tests.get_supabase_uid('user'))),
    false,
    'User can update role');

select
  *
from
  finish();

rollback;
