'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ColumnDef } from '@tanstack/react-table';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

import DataTable from '~/core/ui/DataTable';
import type { getChatbotDocuments } from '~/lib/chatbots/queries';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/core/ui/Dropdown';

import DeleteDocumentModal from './DeleteDocumentModal';

type Data = Awaited<ReturnType<typeof getChatbotDocuments>>;

interface DocumentTableProps extends Data {
  count: number;
  perPage: number;
  page: number;
  query: string;
}

function DocumentsTable(props: DocumentTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const columns = useGetColumns();

  return (
    <DataTable
      pageIndex={props.page - 1}
      pageSize={props.perPage}
      pageCount={Math.ceil(props.count / props.perPage)}
      data={props.data}
      columns={columns}
      onPaginationChange={(state) => {
        router.push(`${pathname}?page=${state.pageIndex + 1}`);
      }}
    />
  );
}

export default DocumentsTable;

function useGetColumns() {
  const { t } = useTranslation('chatbot');
  return useMemo(() => getColumns(t), [t]);
}

function getColumns(t: TFunction<'chatbot'>): ColumnDef<Data['data'][0]>[] {
  return [
    {
      id: 'title',
      header: t('documentTitle'),
      cell: ({ row }) => {
        const doc = row.original;

        return (
          <Link className={'hover:underline'} href={`documents?document=${doc.id}`}>{doc.title}</Link>
        );
      },
    },
    {
      id: 'createdAt',
      header: t('createdAt'),
      cell: ({ row }) => {
        const value = row.original.createdAt;

        return new Date(value).toLocaleString();
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const doc = row.original;

        return (
          <div className={'flex justify-end'}>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <EllipsisVerticalIcon className={'h-4'} />
              </DropdownMenuTrigger>

              <DropdownMenuContent collisionPadding={{ right: 50 }}>
                <DropdownMenuItem asChild>
                  <Link href={`documents?document=${doc.id}`}>
                    {t('viewDocument')}
                  </Link>
                </DropdownMenuItem>

                <DeleteDocumentModal documentId={doc.id}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    {t('deleteDocument')}
                  </DropdownMenuItem>
                </DeleteDocumentModal>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
