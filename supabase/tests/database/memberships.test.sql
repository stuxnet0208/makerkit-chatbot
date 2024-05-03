begin;

create extension "basejump-supabase_test_helpers" version '0.0.6';

select
  no_plan();

select
  tests.create_supabase_user('user');

select
  tests.create_supabase_user('user-2');

select
  tests.create_supabase_user('user-3');

select
  tests.create_supabase_user('user-4');

select
  tests.authenticate_as('user');

select
  create_new_organization('Supabase');

select
  tests.authenticate_as('user-3');

select
  create_new_organization('User 3 Organization');

select
  tests.authenticate_as('user');

select
  isnt_empty($$
    select
      * from memberships
      where
        id = makerkit.get_membership_id((
          select
            id
          from organizations
          where
            name = 'Supabase'), tests.get_supabase_uid('user'));

$$,
'an authenticated user can read a membership if it belongs to the same organization');

select
  tests.authenticate_as('user-2');

select
  is_empty($$
    select
      * from memberships
      where
        id = 12 $$, 'an user cannot read an organization it is not a member of');

select
  is_empty($$
    select
      * from users
      where
        id = tests.get_supabase_uid('user') $$, 'an user cannot read the data of an user of another organization');

set local role postgres;

select
  lives_ok($$
    select
      makerkit.create_db_user(tests.get_supabase_uid('user-2')) $$, 'can create a db user');

select
  lives_ok($$ insert into memberships(
      organization_id, user_id, role)
    values (
      makerkit.get_organization_id(
        'Supabase'), tests.get_supabase_uid(
        'user-2'), 0) $$, 'insert membership into new organization');

select
  throws_ok($$ insert into memberships(
      organization_id, user_id, role)
    values (
      makerkit.get_organization_id(
        'Supabase'), tests.get_supabase_uid(
        'user-3'), 2) $$, 'duplicate key value violates unique constraint "unique_owner"');

select
  lives_ok($$ insert into memberships(
      organization_id, user_id, role)
    values (
      makerkit.get_organization_id(
        'Supabase'), tests.get_supabase_uid(
        'user-3'), 1) $$, 'user can be added as an admin');

select
  tests.authenticate_as('user-2');

select
  is_empty($$ delete from memberships
    where user_id = tests.get_supabase_uid('user-2')
    returning
      id $$);

select
  tests.authenticate_as('user');

select
  isnt_empty($$ delete from memberships
    where user_id = tests.get_supabase_uid('user-2')
    returning
      id $$);

set local role postgres;

insert into users(
  id,
  onboarded)
values (
  tests.get_supabase_uid(
    'user-4'),
  true);

insert into memberships(
  organization_id,
  user_id,
  role)
values (
  makerkit.get_organization_id(
    'Supabase'),
  tests.get_supabase_uid(
    'user-4'),
  0);

select
  (throws_ok($$
      select
	transfer_organization(makerkit.get_organization_id('Supabase'),
	  makerkit.get_membership_id((
            select
              id
            from organizations
            where
              name = 'Supabase'), tests.get_supabase_uid('user-2')));

$$,
'Target user is not a member of this organization'));

select
  tests.authenticate_as('user');

select
  lives_ok($$
    select
      transfer_organization(makerkit.get_organization_id('Supabase'),
	makerkit.get_membership_id((
          select
            id
          from organizations
          where
            name = 'Supabase'), tests.get_supabase_uid('user-3')));

$$,
'transfer ownership of organization to another user');

select
  (isnt_empty($$
      select
        * from memberships
        where
          user_id = tests.get_supabase_uid('user-3')
          and organization_id = makerkit.get_organization_id('Supabase')
          and role = 2 $$, 'verify transfer worked for new owner'));

select
  (isnt_empty($$
      select
        * from memberships
        where
          user_id = tests.get_supabase_uid('user')
          and organization_id = makerkit.get_organization_id('Supabase')
          and role = 1 $$, 'verify transfer worked for previous owner'));

select
  *
from
  finish();

rollback;
