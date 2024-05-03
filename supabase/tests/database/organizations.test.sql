begin;

create extension "basejump-supabase_test_helpers" version '0.0.6';

select
  no_plan();

-- create user 1
select
  tests.create_supabase_user('user');

-- create user 2
select
  tests.create_supabase_user('user-2');

-- anon users cannot call the create_new_organization function
set local role anon;

select throws_ok($$
  select
    create_new_organization('Supabase'); $$,
                 'permission denied for function create_new_organization'
       );

-- authenticated users can (by default) call the create_new_organization
-- function
select
  tests.authenticate_as('user');

select
  lives_ok($$
    select
      create_new_organization('Supabase');

$$,
'can kickstart the creation of an organization and user');

-- the user can read the organization it's part of
select
  tests.authenticate_as('user');

select
  isnt_empty($$
    select
      (id, name)
      from organizations
      where
        name = 'Supabase';

$$,
'an authenticated user can read an organization it is a member of');

select
  tests.authenticate_as('user-2');

select
  create_new_organization('Test');

-- user 2 cannot read the organization we created with another user
select
  is_empty($$
    select
      * from organizations
      where
        id = 0 $$, 'an user cannot read an organization it is not a member of');

select
  *
from
  finish();

rollback;
