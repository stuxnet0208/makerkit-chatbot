import type { Provider } from '@supabase/gotrue-js';
import { StripeCheckoutDisplayMode } from '~/lib/stripe/types';

const production = process.env.NODE_ENV === 'production';

enum Themes {
  Light = 'light',
  Dark = 'dark',
}

const configuration = {
  site: {
    name: 'Makerchat - A SaaS Template for Next.js',
    description: 'Your SaaS Description',
    themeColor: '#ffffff',
    themeColorDark: '#0a0a0a',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Makerchat',
    twitterHandle: '',
    githubHandle: '',
    convertKitFormId: '',
    locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  },
  auth: {
    // ensure this is the same as your Supabase project. By default - it's true
    requireEmailConfirmation:
      process.env.NEXT_PUBLIC_REQUIRE_EMAIL_CONFIRMATION === 'true',
    // NB: Enable the providers below in the Supabase Console
    // in your production project
    providers: {
      emailPassword: true,
      phoneNumber: false,
      emailLink: false,
      emailOtp: false,
      oAuth: ['google'] as Provider[],
    },
  },
  production,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  theme: Themes.Light,
  features: {
    enableThemeSwitcher: true,
    enableAccountDeletion: getBoolean(
      process.env.NEXT_PUBLIC_ENABLE_ACCOUNT_DELETION,
      false,
    ),
    enableOrganizationDeletion: getBoolean(
      process.env.NEXT_PUBLIC_ENABLE_ORGANIZATION_DELETION,
      false,
    ),
  },
  paths: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    signInMfa: '/auth/verify',
    onboarding: `/onboarding`,
    appPrefix: '/dashboard',
    appHome: '/dashboard',
    authCallback: '/auth/callback',
    settings: {
      profile: 'settings/profile',
      organization: 'settings/organization',
      subscription: 'settings/subscription',
      authentication: 'settings/profile/authentication',
      email: 'settings/profile/email',
      password: 'settings/profile/password',
    },
  },
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  stripe: {
    embedded: true,
    displayMode: StripeCheckoutDisplayMode.Popup,
    products: [
      {
        name: 'Basic',
        description: 'A basic plan to get started',
        badge: ``,
        features: [
          'Up to 8,000 AI-generated messages',
          'Up to 500 indexed documents',
          'Fallback to DB search if limit reached',
          'Email Support',
        ],
        plans: [
          {
            name: 'Monthly',
            price: '$9.99',
            stripePriceId: 'basic-plan-mth',
          },
          {
            name: 'Yearly',
            price: '$99.99',
            stripePriceId: 'basic-plan-mth',
          },
        ],
      },
      {
        name: 'Pro',
        badge: `Most Popular`,
        recommended: true,
        description: 'A plan for small scale projects',
        features: [
          'Up to 20,000 AI-generated messages',
          'Up to 2,000 indexed documents',
          'Fallback to DB search if limit reached',
          'Chat and Email Support',
        ],
        plans: [
          {
            name: 'Monthly',
            price: '$29.99',
            stripePriceId: 'pro-plan-mth',
          },
          {
            name: 'Yearly',
            price: '$299.99',
            stripePriceId: 'pro-plan-yr',
          },
        ],
      },
      {
        name: 'Scale',
        description: 'A plan for growing projects',
        badge: ``,
        features: [
          'Unlimited replies',
          'Up to 200,000 AI-generated messages',
          'Up to 20,000 indexed documents',
          'Fallback to DB search if limit reached',
          'Priority Support',
        ],
        plans: [
          {
            name: 'Monthly',
            price: '$69.99',
            stripePriceId: 'scale-plan-mth',
          },
          {
            name: 'Yearly',
            price: '$699.99',
            stripePriceId: 'scale-plan-yr',
          },
        ],
      },
    ],
  },
};

export default configuration;

// Validate Stripe configuration
// as this is a new requirement, we throw an error if the key is not defined
// in the environment
if (
  configuration.stripe.embedded &&
  production &&
  !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
) {
  throw new Error(
    'The key NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined. Please add it to your environment variables.',
  );
}

function getBoolean(value: unknown, defaultValue: boolean) {
  if (typeof value === 'string') {
    return value === 'true';
  }

  return defaultValue;
}
