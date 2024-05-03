'use client';

import useQuery from 'swr';
import useMutation from 'swr/mutation';
import { Control, useFieldArray, useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import Button from '~/core/ui/Button';
import Label from '~/core/ui/Label';
import Stepper from '~/core/ui/Stepper';
import If from '~/core/ui/If';
import Spinner from '~/core/ui/Spinner';
import Alert from '~/core/ui/Alert';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import Heading from '~/core/ui/Heading';
import IconButton from '~/core/ui/IconButton';
import TextField from '~/core/ui/TextField';

import { createChatbotCrawlingJob, getSitemapLinks } from '../actions.server';
import useSupabase from '~/core/hooks/use-supabase';
import SideDialog from '~/core/ui/SideDialog';
import { DialogTitle } from '~/core/ui/Dialog';
import Trans from '~/core/ui/Trans';

import useCurrentOrganization from '~/lib/organizations/hooks/use-current-organization';

const initialFormValues = {
  currentStep: 0,
  filters: {
    allow: [{ value: '' }],
    disallow: [{ value: '' }]
  }
};

function CrawlWebsiteModal(
  props: React.PropsWithChildren<{
    url: string;
    chatbotId: string;
  }>
) {
  return (
    <SideDialog Trigger={props.children}>
      <DialogTitle className={'mb-4'}>
        <Trans i18nKey={'chatbot:crawlWebsiteTitle'} />
      </DialogTitle>

      <ModalForm url={props.url} chatbotId={props.chatbotId} />
    </SideDialog>
  );
}

export default CrawlWebsiteModal;

function ModalForm(
  props: React.PropsWithChildren<{
    url: string;
    chatbotId: string;
  }>
) {
  const form = useForm({
    defaultValues: initialFormValues,
    mode: 'onChange'
  });

  const { t } = useTranslation('chatbot');

  const steps = [
    'chatbot:websiteStepTitle',
    'chatbot:analyzeStepTitle',
    'chatbot:finishStepTitle'
  ];

  const crawlingJobMutation = useStartCrawlingJob();

  const currentStep = form.watch('currentStep');
  const filters = form.watch('filters');

  const getFilters = () => {
    const allow = filters.allow.map((filter) => filter.value);
    const disallow = filters.disallow.map((filter) => filter.value);

    return {
      allow,
      disallow
    };
  };

  const isStep = (step: number) => currentStep === step;

  const setStep = (step: number) => {
    form.setValue('currentStep', step);
  };

  const onStartCrawling = async () => {
    const promise = crawlingJobMutation.trigger({
      chatbotId: props.chatbotId,
      filters: getFilters()
    });

    toast.promise(promise, {
      success: t('crawlingStarted'),
      loading: t('crawlingStarting'),
      error: t('crawlingFailed')
    });
  };

  return (
    <div className={'flex flex-col space-y-12'}>
      <Stepper steps={steps} currentStep={currentStep} />

      <If condition={isStep(0)}>
        <ConfirmWebsiteStep
          control={form.control}
          url={props.url}
          onNext={() => setStep(1)}
        />
      </If>

      <If condition={isStep(1)}>
        <AnalyzeWebsiteSitemapStep
          isCreatingJob={crawlingJobMutation.isMutating}
          url={props.url}
          chatbotId={props.chatbotId}
          filters={getFilters()}
          onNext={onStartCrawling}
          onBack={() => setStep(0)}
        />
      </If>
    </div>
  );
}

function ConfirmWebsiteStep(
  props: React.PropsWithChildren<{
    url: string;
    control: Control<typeof initialFormValues>;
    onNext: () => unknown;
  }>
) {
  return (
    <div className={'flex flex-col space-y-4 animate-in fade-in'}>
      <div className={'flex flex-col space-y-2'}>
        <p>
          <Trans i18nKey={'chatbot:confirmWebsiteStepDescription'} />
        </p>
      </div>

      <div>
        <Label>
          <span>
            <Trans i18nKey={'chatbot:chatbotWebsiteUrl'} />
          </span>
        </Label>

        <pre className={'text-xs bg-gray-50 dark:bg-dark-950 border p-4 mt-2'}>
          <code>{props.url}</code>
        </pre>
      </div>

      <CrawlingFiltersForm control={props.control} />

      <div>
        <Button type={'button'} block onClick={props.onNext}>
          <Trans i18nKey={'chatbot:analyzeSubmitButton'} />
        </Button>
      </div>
    </div>
  );
}

function AnalyzeWebsiteSitemapStep(
  props: React.PropsWithChildren<{
    url: string;
    isCreatingJob: boolean;
    chatbotId: string;

    filters: {
      allow: string[];
      disallow: string[];
    };

    onBack: () => unknown;
    onNext: () => unknown;
  }>
) {
  const { t } = useTranslation('chatbot');

  const { isLoading, data, error } = useSitemapLinks(
    props.chatbotId,
    props.url,
    props.filters
  );

  const organizationId = useCurrentOrganization()?.id;

  const totalNumberOfPages = data?.numberOfPages || 0;
  const numberOfFilteredPages = data?.numberOfFilteredPages || 0;

  const canCreateCrawlingJobQuery = useCanCreateCrawlingJob(
    organizationId,
    numberOfFilteredPages
  );

  if (props.isCreatingJob) {
    return (
      <div
        className={
          'flex flex-col space-y-4 text-sm animate-in fade-in items-center justify-center'
        }
      >
        <Spinner />

        <p>
          <Trans i18nKey={'chatbot:creatingJobSpinnerLabel'} />
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={
          'flex flex-col space-y-4 text-sm animate-in fade-in items-center justify-center'
        }
      >
        <Spinner />

        <p>
          <Trans i18nKey={'chatbot:analyzeLoadingSpinnerLabel'} />
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert type={'error'}>
        <Alert.Heading>
          <Trans i18nKey={'chatbot:websiteAnalysisErrorHeading'} />
        </Alert.Heading>

        <p>
          <Trans i18nKey={'chatbot:websiteAnalysisError'} />
        </p>
      </Alert>
    );
  }

  return (
    <div className={'flex flex-col space-y-4 text-sm animate-in fade-in'}>
      <div className={'flex flex-col space-y-2'}>
        <p
          dangerouslySetInnerHTML={{
            __html: (t(`websiteAnalysisResultHeading`, {
                url: props.url
              })
            )
          }}
        />

        <p
          dangerouslySetInnerHTML={{
            __html: (
              t(`websiteAnalysisResultDescription`, {
                totalNumberOfPages,
                numberOfFilteredPages
              })
            )
          }}
        />
      </div>

      <div className={'flex flex-col space-y-2'}>
        <div>
          <If condition={numberOfFilteredPages > 0}>
            <If
              condition={canCreateCrawlingJobQuery.data}
              fallback={<WarnCannotCreateJobAlert />}
            >
              <Button type={'button'} block onClick={props.onNext}>
                <Trans i18nKey={'chatbot:startCrawlingButton'} />
              </Button>
            </If>
          </If>
        </div>

        <div>
          <Button
            variant={'outline'}
            type={'button'}
            block
            onClick={props.onBack}
          >
            <Trans i18nKey={'common:goBack'} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CrawlingFiltersForm(
  props: React.PropsWithChildren<{
    control: Control<typeof initialFormValues>;
  }>
) {
  const allowList = useFieldArray({
    control: props.control,
    name: 'filters.allow'
  });

  const disallowList = useFieldArray({
    control: props.control,
    name: 'filters.disallow'
  });

  return (
    <div className={'flex flex-col space-y-4'}>
      <div className={'flex flex-col space-y-4'}>
        <div className={'flex flex-col space-y-2'}>
          <Heading type={5}>
            <Trans i18nKey={'chatbot:allowUrlsLabel'} />
          </Heading>

          <span className={'text-sm'}>
            <Trans i18nKey={'chatbot:allowUrlsDescription'} />
          </span>
        </div>

        <div className={'flex flex-col space-y-1'}>
          {allowList.fields.map((field, index) => {
            return (
              <div key={field.id} className={'flex items-center space-x-2'}>
                <TextField.Input
                  {...props.control.register(`filters.allow.${index}.value`)}
                  required
                  type={'text'}
                  className={'flex-1'}
                  placeholder={'Ex. /blog'}
                />

                <If condition={index > 0}>
                  <IconButton
                    type={'button'}
                    onClick={() => allowList.remove(index)}
                  >
                    <XMarkIcon className={'w-4 h-4'} />
                  </IconButton>
                </If>
              </div>
            );
          })}

          <div>
            <Button
              type={'button'}
              onClick={() => allowList.append({ value: '' })}
              size={'sm'}
              variant={'ghost'}
            >
              <span>
                <Trans i18nKey={'chatbot:addInclusionPattern'} />
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div className={'flex flex-col space-y-4'}>
        <div className={'flex flex-col space-y-2'}>
          <Heading type={5}>
            <Trans i18nKey={'chatbot:disallowUrlsLabel'} />
          </Heading>

          <span className={'text-sm'}>
            <Trans i18nKey={'chatbot:disallowUrlsDescription'} />
          </span>
        </div>

        <div className={'flex flex-col space-y-1.5'}>
          {disallowList.fields.map((field, index) => {
            return (
              <div key={field.id} className={'flex items-center space-x-2'}>
                <TextField.Input
                  {...props.control.register(`filters.disallow.${index}.value`)}
                  required
                  type={'text'}
                  className={'flex-1'}
                  placeholder={'Ex. /docs'}
                />

                <If condition={index > 0}>
                  <IconButton
                    type={'button'}
                    onClick={() => disallowList.remove(index)}
                  >
                    <XMarkIcon className={'w-4 h-4'} />
                  </IconButton>
                </If>
              </div>
            );
          })}

          <div>
            <Button
              type={'button'}
              onClick={() => disallowList.append({ value: '' })}
              size={'sm'}
              variant={'ghost'}
            >
              <span>
                <Trans i18nKey={'chatbot:addExclusionPattern'} />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WarnCannotCreateJobAlert() {
  return (
    <Alert type={'warn'}>
      <Alert.Heading>
        <Trans i18nKey={'chatbot:createJobUpgradePlanHeading'} />
      </Alert.Heading>

      <Trans i18nKey={'chatbot:upgradePlanDescription'} />
    </Alert>
  );
}

function useCanCreateCrawlingJob(
  organizationId: number | undefined,
  requestedDocuments: number
) {
  const supabase = useSupabase();
  const key = ['can-create-crawling-job', requestedDocuments, organizationId];

  return useQuery(key, async () => {
    if (!organizationId) {
      return false;
    }

    const { data, error } = await supabase.rpc('can_index_documents', {
      requested_documents: requestedDocuments,
      org_id: organizationId
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  });
}

function useStartCrawlingJob() {
  const csrfToken = useCsrfToken();

  type Params = {
    chatbotId: string;

    filters: {
      allow: string[];
      disallow: string[];
    };
  };

  return useMutation(['start-crawling-job'], (_, { arg }: { arg: Params }) => {
    return createChatbotCrawlingJob({ ...arg, csrfToken });
  });
}

function useSitemapLinks(
  chatbotId: string,
  url: string,
  filters: {
    allow: string[];
    disallow: string[];
  }
) {
  const csrfToken = useCsrfToken();
  const key = ['sitemap-links', chatbotId, url, JSON.stringify(filters)];

  return useQuery(key, async () => {
    return getSitemapLinks({ chatbotId, csrfToken, filters });
  });
}
