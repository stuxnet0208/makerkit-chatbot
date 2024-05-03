create unique index unique_owner on memberships(organization_id, role)
where (role = 2);
