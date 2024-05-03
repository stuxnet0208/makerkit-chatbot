'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

import MembershipRole from '~/lib/organizations/types/membership-role';

import {
  acceptInviteToOrganization,
  deleteMembershipById,
  updateMembershipById,
} from '~/lib/memberships/mutations';

import getLogger from '~/core/logger';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { getOrganizationById } from '~/lib/organizations/database/queries';

import configuration from '~/configuration';
import { Database } from '~/database.types';

export const updateMemberAction = withSession(
  async (params: { membershipId: number; role: MembershipRole }) => {
    const client = getSupabaseServerActionClient();

    await handleUpdateMemberRequest(client, params);

    // we revalidate the cache for the members page
    revalidateMembersPage();

    return {
      success: true,
    };
  },
);

export const deleteMemberAction = withSession(
  async (params: { membershipId: number }) => {
    const client = getSupabaseServerActionClient();

    await handleRemoveMemberRequest(client, params.membershipId);

    // we revalidate the cache for the members page
    revalidateMembersPage();

    return {
      success: true,
    };
  },
);

export const acceptInviteAction = async (params: {
  code: string;
  userId?: string;
}) => {
  const code = params.code;

  const logger = getLogger();
  const client = getSupabaseServerActionClient();

  // if the user ID is provided, we use it
  // (for example, when signing up for the 1st time)
  let userId = params.userId;
  let signedIn = false;

  // if the user ID is not provided, we try to get it from the session
  if (!userId) {
    const { data } = await client.auth.getUser();

    // if the session is not available, we throw an error
    if (!data.user) {
      throw new Error(`Session not available`);
    }

    userId = data.user.id;
    signedIn = true;
  }

  if (params.userId && params.userId !== userId) {
    throw new Error(`User ID mismatch`);
  }

  logger.info(
    {
      code,
      userId,
    },
    `Adding member to organization...`,
  );

  const adminClient = getSupabaseServerActionClient({
    admin: true,
  });

  const { data, error } = await acceptInviteToOrganization(adminClient, {
    code,
    userId,
  });

  if (error) {
    throw new Error(`Error accepting invite to organization: ${error.message}`);
  }

  const result = data as { organization: number; membership: number };
  const organizationId = result.organization;
  const membershipId = result.membership;

  logger.info(
    {
      membershipId,
      organizationId,
      userId,
    },
    `Member successfully added to organization`,
  );

  const organizationResponse = await getOrganizationById(
    adminClient,
    organizationId,
  );

  if (organizationResponse.error) {
    throw organizationResponse.error;
  }

  const needsEmailVerification =
    configuration.auth.requireEmailConfirmation && !signedIn;

  // if the user is *not* required to confirm their email
  // we redirect them to the app home
  if (!needsEmailVerification) {
    logger.info(
      {
        membershipId,
      },
      `Redirecting user to app home...`,
    );

    redirect(configuration.paths.appHome);
  }

  logger.info(
    {
      membershipId,
    },
    `User needs to verify their email address - returning JSON response...`,
  );

  return {
    success: true,
    needsEmailVerification,
  };
};

async function handleRemoveMemberRequest(
  client: SupabaseClient<Database>,
  membershipId: number,
) {
  const logger = getLogger();

  logger.info(
    {
      membershipId,
    },
    `Removing member...`,
  );

  const { error } = await deleteMembershipById(client, membershipId);

  if (error) {
    logger.error(
      {
        membershipId,
        error,
      },
      `Error removing member`,
    );

    throw new Error(`Error removing member`);
  }

  logger.info(
    {
      membershipId,
    },
    `Member successfully removed.`,
  );
}

async function handleUpdateMemberRequest(
  client: SupabaseClient<Database>,
  params: {
    membershipId: number;
    role: MembershipRole;
  },
) {
  const logger = getLogger();
  const { role, membershipId } = getUpdateMembershipBodySchema().parse(params);

  logger.info(
    {
      membershipId,
      role,
    },
    `Updating member...`,
  );

  const canUpdateUserRoleResponse = await client.rpc('can_update_user_role', {
    membership_id: membershipId,
  });

  if (canUpdateUserRoleResponse.error || !canUpdateUserRoleResponse.data) {
    logger.error(
      {
        membershipId,
        error: canUpdateUserRoleResponse.error,
      },
      `Error checking if user can update role`,
    );

    throw new Error(`Error checking if user can update role`);
  }

  // we use the Admin client to update the membership
  // as we have no RLS policies on the memberships table to update the role
  const adminClient = getSupabaseServerActionClient({ admin: true });

  const { error } = await updateMembershipById(adminClient, {
    id: membershipId,
    role,
  });

  if (error) {
    logger.error(
      {
        membershipId,
        error,
      },
      `Error updating member`,
    );

    throw new Error(`Error updating member`);
  }

  logger.info(
    {
      membershipId,
    },
    `Member successfully updated.`,
  );
}

function getUpdateMembershipBodySchema() {
  return z.object({
    role: z.nativeEnum(MembershipRole),
    membershipId: z.number(),
  });
}

function revalidateMembersPage() {
  return revalidatePath('/settings/organization/members');
}
