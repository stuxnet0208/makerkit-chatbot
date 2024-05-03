begin;

create extension "basejump-supabase_test_helpers" version '0.0.6';

select
  plan(10);

set LOCAL search_path = core, PUBLIC, extensions;

select
  has_table('organizations');

select
  has_table('memberships');

select
  has_table('users');

select
  has_table('subscriptions');

select
  has_table('organizations_subscriptions');

select
  check_test(tests.rls_enabled('public', 'organizations'), true);

select
  check_test(tests.rls_enabled('public', 'memberships'), true);

select
  check_test(tests.rls_enabled('public', 'users'), true);

select
  check_test(tests.rls_enabled('public', 'subscriptions'), true);

select
  check_test(tests.rls_enabled('public', 'organizations_subscriptions'), true);

select
  *
from
  finish();

rollback;
