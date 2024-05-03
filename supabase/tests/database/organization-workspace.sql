begin;

create extension "basejump-supabase_test_helpers" version '0.0.6';

select
  no_plan();

create table _workspaces(
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  organization_id bigint not null references organizations(id)
);

alter table _workspaces enable row level security;

create policy "Can read workspace" on _workspaces
  for select to authenticated
    using (current_user_is_member_of_organization(organization_id));

create policy "Can delete workspace" on _workspaces
  for delete to authenticated
    using (current_user_is_member_of_organization(organization_id));

create policy "Can update workspace" on _workspaces
  for update to authenticated
    using (current_user_is_member_of_organization(organization_id))
    with check (current_user_is_member_of_organization(organization_id));

create policy "Can insert workspace" on _workspaces
  for insert to authenticated
    with check (
current_user_is_member_of_organization(
    organization_id));

select
  tests.create_supabase_user('user');

select
  tests.create_supabase_user('user-2');

select
  tests.authenticate_as('user');

select
  lives_ok($$
    select
      create_new_organization('Test Organization');

$$,
'can create an organization');

insert into _workspaces(
  name,
  organization_id)
values (
  'Test Workspace',
  makerkit.get_organization_id(
    'Test Organization'));

set local role anon;

select
  tests.authenticate_as('user');

select
  (isnt_empty($$
      select
        * from _workspaces
        where
          name = 'Test Workspace' $$, 'can read a workspace if it belongs to the same organization'));

select
  tests.authenticate_as('user-2');

select
  (is_empty($$
      select
        * from _workspaces
        where
          name = 'Test Workspace' $$, 'cannot read a workspace if it does not belong to the same organization'));

select
  tests.authenticate_as('user');

select
  (lives_ok($$ update
        _workspaces
      set
        name = 'Test Workspace 2'
        where
          name = 'Test Workspace' $$, 'can update a workspace if it belongs to the same organization'));

select
  (isnt_empty($$
      select
        * from _workspaces
        where
          name = 'Test Workspace 2' $$, 'verify update worked'));

select
  tests.authenticate_as('user-2');

select
  (lives_ok($$ delete from _workspaces
      where name = 'Test Workspace 2' $$, 'cannot delete a workspace if it belongs to the same organization'));

select
  tests.authenticate_as('user');

select
  (isnt_empty($$
      select
        * from _workspaces
        where
          name = 'Test Workspace 2' $$, 'verify delete did not work'));

select
  (lives_ok($$ delete from _workspaces
      where name = 'Test Workspace 2' $$, 'can delete a workspace if it belongs to the same organization'));

select
  (is_empty($$
      select
        * from _workspaces
        where
          name = 'Test Workspace 2' $$, 'verify delete did work'));

select
  tests.authenticate_as('user-2');

select
  throws_ok($$ insert into _workspaces(
      name, organization_id)
    values (
      'Test Workspace 2', makerkit.get_organization_id(
        'Test Organization'));

$$);

select
  tests.authenticate_as('user');

select
  lives_ok($$ insert into _workspaces(
      name, organization_id)
    values (
      'Test Workspace 2', makerkit.get_organization_id(
        'Test Organization'));

$$,
'can insert a workspace if it does belong to the same organization');

select
  *
from
  finish();

rollback;
