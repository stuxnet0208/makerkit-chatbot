/**
 * Makerkit SDK [Experimental]
 *
 * This SDK is a wrapper around the Supabase client that provides a more
 * convenient interface for interacting with the Makerkit's core entities,
 * such as organizations, users, and subscriptions.
 *
 * The SDK is currently experimental and is not recommended for production use.
 *
 * Usage:
 *
 * import getSdk from '~/lib/sdk';
 *
 * // Get the Supabase client instance in a Server Component.
 * const supabaseClient = getSupabaseServerComponentClient();
 * const sdk = getSdk(supabaseClient);
 *
 * // Get the current user.
 *
 * const user = await sdk.user.getCurrent();
 *
 * // Get the current organization.
 *
 * const organization = await sdk.organization.getCurrent();
 *
 * // Get the current organization's subscription.
 *
 * const subscription = await sdk.organization.getSubscription();
 * const isSubscriptionActive = await subscription.isActive();
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';

import { parseOrganizationIdCookie } from '~/lib/server/cookies/organization.cookie';

import {
  getOrganizationByUid,
  getOrganizationInvitedMembers,
} from '~/lib/organizations/database/queries';

import { OrganizationSubscription } from '~/lib/organizations/types/organization-subscription';
import { getUserById } from '~/lib/user/database/queries';
import { getMembershipsByOrganizationUid } from '~/app/admin/organizations/queries';

type Client = SupabaseClient<Database>;

/**
 * Retrieves the Makerkit SDK instance.
 * Currently, this is an experimental feature and is not recommended for production use.
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance.
 * @return {MakerkitSdk} - The Makerkit SDK instance.
 */
export default function experimental_getSdk(
  client: SupabaseClient<Database>,
): MakerkitSdk {
  return new MakerkitSdk(client);
}

class MakerkitSdk {
  public organization: OrganizationSdk;
  public user: UserSdk;
  public subscriptions: SubscriptionsSdk;

  /**
   * Constructs a new instance of the class using the provided Supabase client.
   *
   * @param {Client} client - The Supabase client object to be used for
   * making API calls.
   */
  constructor(client: Client) {
    this.organization = new OrganizationSdk(client, new MembershipsSdk(client));
    this.subscriptions = new SubscriptionsSdk(client);
    this.user = new UserSdk(client);
  }
}

class OrganizationSdk {
  constructor(
    private client: Client,
    public memberships: MembershipsSdk,
  ) {}

  /**
   * Retrieves the current organization for the user.
   */
  public async getCurrent() {
    const organizationUid = await this.getCurrentOrganizationUid();

    if (!organizationUid) {
      return;
    }

    const response = await getOrganizationByUid(this.client, organizationUid);

    if (response.error) {
      throw response.error;
    }

    return response.data ?? undefined;
  }

  /**
   * Retrieves the subscription information for the organization.
   *
   * @returns {Promise<OrganizationSubscriptionSdk>} A promise that resolves to an instance of OrganizationSubscriptionSdk representing the subscription information for the organization.
   */
  public async getSubscription() {
    const data = await this.getCurrent();

    return new OrganizationSubscriptionSdk(data?.subscription);
  }

  /**
   * Returns the organization UID for the current user.
   *
   * */
  public async getCurrentOrganizationUid() {
    const userId = await experimental_getSdk(this.client).user.getCurrentId();

    if (!userId) {
      return;
    }

    return await parseOrganizationIdCookie(userId);
  }
}

class UserSdk {
  constructor(private readonly client: Client) {}

  /**
   * Returns the current user in Supabase Auth
   */
  public getCurrent() {
    return this.client.auth.getUser();
  }

  /**
   * Retrieves the current session of the client.
   */
  public getCurrentSession() {
    return this.client.auth.getSession();
  }

  /**
   * Retrieves the current user ID from the session.
   */
  public async getCurrentId() {
    const response = await this.getCurrentSession();

    return response.data.session?.user.id;
  }

  /**
   * Fetches data from the server and returns it.
   *
   * @async
   * @throws {Error} If there is an error in fetching the data or retrieving the user.
   */
  public async getData() {
    const response = await this.getCurrent();

    if (!response || !response.data.user) {
      return;
    }

    const { data, error } = await getUserById(
      this.client,
      response.data.user.id,
    );

    if (error) {
      throw error;
    }

    return data;
  }
}

class SubscriptionsSdk {
  constructor(private client: Client) {}

  /**
   * Retrieves the subscription for a given organization UID.
   *
   * @param {string} organizationUid - The unique identifier of the organization.
   */
  public async getSubscriptionByOrganizationUid(organizationUid: string) {
    const { data, error } = await getOrganizationByUid(
      this.client,
      organizationUid,
    );

    if (error) {
      throw error;
    }

    return data?.subscription;
  }

  /**
   * Determines if the organization with the given organizationId is active or on trial.
   */
  public async isActive(organizationId: string) {
    const subscription =
      await this.getSubscriptionByOrganizationUid(organizationId);

    return this.checkStatusIsActive(subscription?.data?.status);
  }

  private checkStatusIsActive(
    status: Maybe<OrganizationSubscription['status']>,
  ) {
    return status && ['active', 'trialing'].includes(status);
  }
}

class OrganizationSubscriptionSdk {
  constructor(
    private subscription: Maybe<{
      data: Maybe<OrganizationSubscription>;
      customerId: Maybe<string>;
    }>,
  ) {}

  private get data() {
    return this.subscription?.data;
  }

  /**
   * Gets the customer id associated with the subscription.
   */
  public get customerId() {
    return this.subscription?.customerId;
  }

  /**
   * Retrieves the status of the data.
   *
   */
  public get status() {
    return this.data?.status;
  }

  /**
   * Checks if the subscription is in trial mode.
   */
  public async isTrial() {
    return this.status === 'trialing';
  }

  public get priceId() {
    return this.data?.priceId;
  }

  /**
   * Checks if the subscription is for the given Stripe price ID.
   * @param stripePriceId The Stripe price ID to check.
   */
  public async isPlan(stripePriceId: string) {
    return this.priceId === stripePriceId;
  }

  /**
   * Checks if the status of the subscription is active or trialing.
   **/
  public async isActive() {
    if (!this.status) {
      return false;
    }

    return ['active', 'trialing'].includes(this.status);
  }

  /**
   * Checks if the given status matches the current status of the Subscription.
   **/
  public isStatus(status: OrganizationSubscription['status']) {
    return this.status === status;
  }
}

class MembershipsSdk {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Get memberships by organization UID.
   */
  public get(params: {
    uid: string;
    page: number;
    perPage: number;
  }): Promise<any> {
    return getMembershipsByOrganizationUid(this.client, params);
  }

  /**
   * Retrieves the list of invitations for a given organization.
   */
  public getInvitations(organizationId: number) {
    return getOrganizationInvitedMembers(this.client, organizationId);
  }
}
