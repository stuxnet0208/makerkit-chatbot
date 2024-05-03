'use client';

import { useEffect, useState } from 'react';
import useQuery from 'swr';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

import SideDialog from '~/core/ui/SideDialog';
import { DialogTitle } from '~/core/ui/Dialog';
import { getDocumentById } from '~/lib/chatbots/queries';
import useSupabase from '~/core/hooks/use-supabase';
import If from '~/core/ui/If';
import Spinner from '~/core/ui/Spinner';
import Alert from '~/core/ui/Alert';
import Trans from '~/core/ui/Trans';

import MarkdownRenderer from '~/core/ui/markdown/MarkdownRenderer';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/core/ui/Dropdown';

import DeleteDocumentModal from '../components/DeleteDocumentModal';

function DocumentDialog() {
  const params = useSearchParams();
  const value = params.get('document');

  const [docId, setDocId] = useState(value);
  const router = useRouter();
  const pathName = usePathname();

  useEffect(() => {
    setDocId(value);
  }, [value]);

  if (!docId) {
    return null;
  }

  return (
    <SideDialog open={!!value} onOpenChange={open => {
      if (!open) {
        setDocId(null);
        // remove the query param from the url when the dialog is closed
        router.replace(pathName);
      }
    }}>
      <DocumentContent documentId={docId} onBeforeDelete={() => setDocId(null)} />
    </SideDialog>
  );
}

export default DocumentDialog;

function DocumentContent(props: {
  documentId: string;
  onBeforeDelete?: () => void;
}) {
  const { data, isLoading, error } = useFetchDocument(props.documentId);

  if (error) {
    return (
      <Alert type={'warn'}>
        <Alert.Heading>
          <Trans i18nKey={'chatbot:documentNotFound'} />
        </Alert.Heading>

        <Trans i18nKey={'chatbot:documentNotFoundDescription'} />
      </Alert>
    );
  }

  return (
    <>
      <If condition={isLoading}>
        <div className={'flex items-center space-x-4'}>
          <Spinner />

          <span>
            <Trans i18nKey={'chatbot:loadingDocument'} />
          </span>
        </div>
      </If>

      <If condition={data}>
        {(doc) => (
          <div className={'flex flex-col space-y-6 divide-y w-full'}>
            <div className={'flex justify-between w-full items-center'}>
              <DialogTitle>{doc.title}</DialogTitle>

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <EllipsisVerticalIcon className={'w-5'} />
                </DropdownMenuTrigger>

                <DropdownMenuContent collisionPadding={{ right: 20 }}>
                  <DeleteDocumentModal
                    onBeforeDelete={props.onBeforeDelete}
                    documentId={doc.id}
                  >
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trans i18nKey={'chatbot:deleteDocument'} />
                    </DropdownMenuItem>
                  </DeleteDocumentModal>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div
              className={
                'overflow-y-auto h-full w-full absolute pb-36 top-10 -m-6 p-6'
              }
            >
              <MarkdownRenderer>{doc.content}</MarkdownRenderer>
            </div>
          </div>
        )}
      </If>
    </>
  );
}

function useFetchDocument(documentId: string) {
  const client = useSupabase();
  const key = ['documents', documentId];

  return useQuery(key, async () => {
    const { data, error } = await getDocumentById(client, documentId);

    if (error) {
      throw error;
    }

    return data;
  });
}
