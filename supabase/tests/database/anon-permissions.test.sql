begin;

create extension "basejump-supabase_test_helpers" version '0.0.6';

select
  no_plan();

set local role anon;

select throws_ok($$
  select
    * from users
$$, 'permission denied for table users');

select throws_ok($$
  select
    * from organizations
$$, 'permission denied for table organizations');

select throws_ok($$
  select
    * from memberships
$$, 'permission denied for table memberships');

select throws_ok($$
  select
    * from organizations_subscriptions
$$, 'permission denied for table organizations_subscriptions');

select throws_ok($$
  select
    * from subscriptions
$$, 'permission denied for table subscriptions');

select
  *
from
  finish();

rollback;
