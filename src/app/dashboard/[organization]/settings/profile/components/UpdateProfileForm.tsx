import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

import type { SupabaseClient } from '@supabase/supabase-js';

import useUpdateProfileMutation from '~/lib/user/hooks/use-update-profile';

import Button from '~/core/ui/Button';
import TextField from '~/core/ui/TextField';
import Trans from '~/core/ui/Trans';
import useSupabase from '~/core/hooks/use-supabase';

import type UserSession from '~/core/session/types/user-session';
import type UserData from '~/core/session/types/user-data';

import configuration from '~/configuration';
import ImageUploader from '~/core/ui/ImageUploader';
import { USERS_TABLE } from '~/lib/db-tables';

const AVATARS_BUCKET = 'avatars';

function UpdateProfileForm({
  session,
  onUpdateProfileData,
}: {
  session: UserSession;
  onUpdateProfileData: (user: Partial<UserData>) => void;
}) {
  const updateProfileMutation = useUpdateProfileMutation();
  const { t } = useTranslation();

  const currentPhotoURL = session.data?.photoUrl ?? '';
  const currentDisplayName = session?.data?.displayName ?? '';

  const user = session.auth?.user;
  const email = user?.email ?? '';

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      displayName: currentDisplayName,
    },
  });

  const onSubmit = async (displayName: string) => {
    if (!user?.id) {
      return;
    }

    const info = {
      id: user.id,
      displayName,
    };

    const promise = updateProfileMutation.trigger(info).then(() => {
      onUpdateProfileData(info);
    });

    return toast.promise(promise, {
      success: t(`profile:updateProfileSuccess`),
      error: t(`profile:updateProfileError`),
      loading: t(`profile:updateProfileLoading`),
    });
  };

  const displayNameControl = register('displayName', {
    value: currentDisplayName,
    maxLength: 100,
    minLength: 2,
  });

  useEffect(() => {
    reset({
      displayName: currentDisplayName ?? '',
    });
  }, [currentDisplayName, currentPhotoURL, reset]);

  return (
    <div className={'flex flex-col space-y-8'}>
      <UploadProfileAvatarForm
        currentPhotoURL={currentPhotoURL}
        userId={user?.id}
        onAvatarUpdated={(photoUrl) => onUpdateProfileData({ photoUrl })}
      />

      <form
        data-cy={'update-profile-form'}
        className={'flex flex-col space-y-4'}
        onSubmit={handleSubmit((value) => {
          return onSubmit(value.displayName);
        })}
      >
        <TextField>
          <TextField.Label>
            <Trans i18nKey={'profile:displayNameLabel'} />

            <TextField.Input
              {...displayNameControl}
              data-cy={'profile-display-name'}
              minLength={2}
              placeholder={''}
              maxLength={100}
            />
          </TextField.Label>
        </TextField>

        <TextField>
          <TextField.Label>
            <Trans i18nKey={'profile:emailLabel'} />

            <TextField.Input disabled value={email} />
          </TextField.Label>

          <div>
            <Button
              type={'button'}
              variant={'ghost'}
              size={'small'}
              href={'../' + configuration.paths.settings.email}
            >
              <span className={'text-xs font-normal'}>
                <Trans i18nKey={'profile:updateEmailSubmitLabel'} />
              </span>
            </Button>
          </div>
        </TextField>

        <div>
          <Button
            className={'w-full md:w-auto'}
            loading={updateProfileMutation.isMutating}
          >
            <Trans i18nKey={'profile:updateProfileSubmitLabel'} />
          </Button>
        </div>
      </form>
    </div>
  );
}

function UploadProfileAvatarForm(props: {
  currentPhotoURL: string | null;
  userId: string;
  onAvatarUpdated: (url: string | null) => void;
}) {
  const client = useSupabase();
  const { t } = useTranslation('profile');

  const createToaster = useCallback(
    (promise: Promise<unknown>) => {
      return toast.promise(promise, {
        success: t(`updateProfileSuccess`),
        error: t(`updateProfileError`),
        loading: t(`updateProfileLoading`),
      });
    },
    [t],
  );

  const onValueChange = useCallback(
    async (file: File | null) => {
      const removeExistingStorageFile = () => {
        if (props.currentPhotoURL) {
          return (
            deleteProfilePhoto(client, props.currentPhotoURL) ??
            Promise.resolve()
          );
        }

        return Promise.resolve();
      };

      if (file) {
        const promise = removeExistingStorageFile().then(() =>
          uploadUserProfilePhoto(client, file, props.userId).then(
            (photoUrl) => {
              props.onAvatarUpdated(photoUrl);

              return client
                .from(USERS_TABLE)
                .update({
                  photo_url: photoUrl,
                })
                .eq('id', props.userId)
                .throwOnError();
            },
          ),
        );

        createToaster(promise);
      } else {
        const promise = removeExistingStorageFile().then(() => {
          props.onAvatarUpdated(null);

          return client
            .from(USERS_TABLE)
            .update({
              photo_url: null,
            })
            .eq('id', props.userId)
            .throwOnError();
        });

        createToaster(promise);
      }
    },
    [client, createToaster, props],
  );

  return (
    <ImageUploader value={props.currentPhotoURL} onValueChange={onValueChange}>
      <div className={'flex flex-col space-y-1'}>
        <span className={'text-sm'}>
          <Trans i18nKey={'profile:profilePictureHeading'} />
        </span>

        <span className={'text-xs'}>
          <Trans i18nKey={'profile:profilePictureSubheading'} />
        </span>
      </div>
    </ImageUploader>
  );
}

async function uploadUserProfilePhoto(
  client: SupabaseClient,
  photoFile: File,
  userId: string,
) {
  const bytes = await photoFile.arrayBuffer();
  const bucket = client.storage.from(AVATARS_BUCKET);
  const extension = photoFile.name.split('.').pop();
  const fileName = await getAvatarFileName(userId, extension);

  const result = await bucket.upload(fileName, bytes, {
    upsert: true,
  });

  if (!result.error) {
    return bucket.getPublicUrl(fileName).data.publicUrl;
  }

  throw result.error;
}

function deleteProfilePhoto(client: SupabaseClient, url: string) {
  const bucket = client.storage.from(AVATARS_BUCKET);
  const fileName = url.split('/').pop()?.split('?')[0];

  if (!fileName) {
    return;
  }

  return bucket.remove([fileName]);
}

async function getAvatarFileName(
  userId: string,
  extension: string | undefined,
) {
  const { nanoid } = await import('nanoid');
  const uniqueId = nanoid(16);

  return `${userId}.${extension}?v=${uniqueId}`;
}

export default UpdateProfileForm;
