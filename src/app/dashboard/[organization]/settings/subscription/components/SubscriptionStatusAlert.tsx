import classNames from 'clsx';
import type { OrganizationSubscription } from '~/lib/organizations/types/organization-subscription';

import Trans from '~/core/ui/Trans';

function SubscriptionStatusAlert(
  props: React.PropsWithChildren<{
    subscription: OrganizationSubscription;
    values: {
      endDate: string;
      trialEndDate: string | null;
    };
  }>,
) {
  const status = props.subscription.status;

  let message = '';
  let type: 'success' | 'error' | 'warn';

  switch (status) {
    case 'active':
      message = 'subscription:status.active.description';
      type = 'success';
      break;
    case 'trialing':
      message = 'subscription:status.trialing.description';
      type = 'success';
      break;
    case 'canceled':
      message = 'subscription:status.canceled.description';
      type = 'warn';
      break;
    case 'incomplete':
      message = 'subscription:status.incomplete.description';
      type = 'warn';
      break;
    case 'incomplete_expired':
      message = 'subscription:status.incomplete_expired.description';
      type = 'error';
      break;
    case 'unpaid':
      message = 'subscription:status.unpaid.description';
      type = 'error';
      break;
    case 'past_due':
      message = 'subscription:status.past_due.description';
      type = 'error';

      break;
    default:
      return null;
  }

  return (
    <span
      className={classNames('text-sm', {
        'text-orange-700 dark:text-gray-400': type === 'warn',
        'text-red-700 dark:text-red-400': type === 'error',
        'text-green-700 dark:text-green-400': type === 'success',
      })}
    >
      <Trans i18nKey={message} values={props.values} />
    </span>
  );
}

export default SubscriptionStatusAlert;
