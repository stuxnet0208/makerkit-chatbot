'use client';

import { ColumnDef, Row } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { ObjectToCamel } from 'ts-case-convert/lib/caseConvert';

import DataTable from '~/core/ui/DataTable';
import Badge from '~/core/ui/Badge';
import Trans from '~/core/ui/Trans';
import { Database } from '~/database.types';

type Jobs = Database['public']['Tables']['jobs']['Row'];

function JobsTable(props: {
  jobs: Array<ObjectToCamel<Jobs>>;
  page: number;
  perPage: number;
  count: number;
}) {
  const pageCount = Math.ceil(props.count / props.perPage);
  const columns = useColumns();

  return (
    <div>
      <DataTable
        data={props.jobs ?? []}
        pageCount={pageCount}
        pageSize={props.perPage}
        pageIndex={props.page - 1}
        columns={columns}
      />
    </div>
  );
}

export default JobsTable;

function JobStatusBadge({ status }: { status: Jobs['status'] }) {
  switch (status) {
    case 'failed':
      return (
        <Badge className={'inline-flex'} size={'small'} color={'error'}>
          <Trans i18nKey={'chatbot:jobFailed'} />
        </Badge>
      );

    case 'completed':
      return (
        <Badge className={'inline-flex'} size={'small'} color={'success'}>
          <Trans i18nKey={'chatbot:jobCompleted'} />
        </Badge>
      );

    case 'pending':
      return (
        <Badge className={'inline-flex'} size={'small'}>
          <Trans i18nKey={'chatbot:jobInProgress'} />
        </Badge>
      );
  }
}

function DateRenderer({
  row,
  accessorKey,
}: React.PropsWithChildren<{
  row: Row<ObjectToCamel<Jobs>>;
  accessorKey: keyof ObjectToCamel<Jobs>;
}>) {
  const doc = row.original;

  if (accessorKey in doc && doc[accessorKey]) {
    const value = doc[accessorKey] as string;

    return <span>{new Date(value).toDateString()}</span>;
  }

  return <>-</>;
}

function useColumns() {
  const { t } = useTranslation('chatbot');

  const columns: ColumnDef<ObjectToCamel<Jobs>>[] = [
    {
      header: t('createdAt'),
      id: 'createdAt',
      cell: ({ row }) => {
        return <DateRenderer row={row} accessorKey={'createdAt'} />;
      },
    },
    {
      header: t('jobStatus'),
      id: 'status',
      cell: ({ row }) => {
        return <JobStatusBadge status={row.original.status} />;
      },
    },
    {
      header: t('tasksCompleted'),
      id: 'completedTasks',
      accessorKey: 'tasksCompleted',
    },
    {
      header: t('tasksTotal'),
      id: 'totalTasks',
      accessorKey: 'tasksCount',
    },
  ];

  return columns;
}
