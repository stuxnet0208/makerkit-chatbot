begin;

create extension "basejump-supabase_test_helpers" version '0.0.6';

select
  no_plan();

select
  lives_ok($$ insert into auth.users(
      id)
    values (
      '0414aff1-834d-4613-9c93-1b45ec9ddea1');

$$,
'can create an auth user');

set local role authenticated;

select
  throws_ok($$ insert into users(
      id, onboarded)
    values (
      '0414aff1-834d-4613-9c93-1b45ec9ddea1', true);

$$,
'new row violates row-level security policy for table "users"',
'cannot create a user without being authenticated');

select
  tests.create_supabase_user('user');

select
  tests.create_supabase_user('user-2');

select
  tests.authenticate_as('user');

select
  is_empty($$
    select
      * from users
      where
        id = tests.get_supabase_uid('user-2') $$, 'cannot read the data of another user');

select
  *
from
  finish();

rollback;
