'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { useMemo } from 'react';

interface DataGridProps {
  data: any[];
  title?: string;
}

export default function DataGrid({ data, title }: DataGridProps) {
  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    if (!data || data.length === 0) return [];

    const firstRow = data[0];
    return Object.keys(firstRow).map(key => ({
      accessorKey: key,
      header: key,
      cell: (info: any) => {
        const value = info.getValue();
        if (typeof value === 'number') {
          return value.toLocaleString();
        }
        return value?.toString() || '';
      },
    }));
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>No data to display</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {title && (
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-light text-gray-600 tracking-wider uppercase">{title}</h3>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-100 border-b">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left font-light text-xs text-gray-600 uppercase tracking-wider border-r border-gray-100 last:border-r-0"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={`border-b ${
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-blue-50`}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="px-3 py-1.5 border-r border-gray-50 last:border-r-0 text-gray-700 text-sm font-light"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 font-light">
        {data.length} rows · {columns.length} columns
      </div>
    </div>
  );
}