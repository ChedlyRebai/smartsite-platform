"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, ListPlusIcon, SearchIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import toast from "react-hot-toast";
import { User } from "@/app/types";

interface DataTableProps<TData, TValue> {
  //columns: ColumnDef<TData, TValue>[];
  users: User[];
}

export function UserDataTable<TData, TValue>({
  users,
}: DataTableProps<TData, TValue>) {
  const [data, setData] = useState<User[]>([]);
  const [TotalPages, setTotalPages] = useState(0);
  const [TotalAccount, setTotalAccount] = useState(0);
  console.log("users:", users);
  const columns: ColumnDef<User>[] = [
    //     {
    //     id: '12',
    //     firstName: 'Leila',
    //     lastName: 'Mansour',
    //     email: 'leila.mansour@smartsite.com',
    //     phone: '+216 98 234 567',
    //     role: 'user',
    //     isActive: true,
    //     createdDate: '2026-01-05',
    //     lastLoginDate: '2026-02-16',
    //   },
    {
      accessorKey: "id",
      header: ({ column }) => {
        return <></>;
      },
      cell: ({ row }) => {
        return <></>;
      },
    },
    {
      accessorKey: "firstname",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            firstName
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "lastname",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            lastName
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "cin",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            cin
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "role.name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            role
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "estActif",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            isActive
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            createdDate
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  console.log(users);

  return (
    <>
      <div className="flex justify-end  items-center py-4 flex-wrap">
        <Button
          //   disabled={access.creation === "N"}
          variant="default"
          className=""
        >
          <ListPlusIcon className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>
      <div className={`rounded-md border }`}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            <>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                // Replace <TableCell>Pas de résultats.</TableCell> with your custom no results component
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Pas de résultats.
                  </TableCell>
                </TableRow>
              )}
            </>
            {/* )} */}
          </TableBody>
        </Table>
      </div>
      {/* <DataTablePagination
        totalPages={TotalPages}
        TotalAccount={TotalAccount}
        table={table}
      /> */}
    </>
  );
}
