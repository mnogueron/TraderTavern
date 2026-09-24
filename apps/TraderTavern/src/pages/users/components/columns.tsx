import type { ColumnDef } from '@tanstack/react-table';
import type { ApiResponse } from '@trader-tavern/api-client';
import { Badge } from '@/components/ui/badge';

export type User = ApiResponse<'get', '/api/user'>['data'][number];

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'username',
    header: 'Username',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.username}</span>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
  },
];
