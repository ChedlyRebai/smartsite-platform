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
import useAddUserModal from "@/app/hooks/use-user-Modal";
import { Badge } from "@/app/components/ui/badge";

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

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

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
            Full name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({row})=>{
        const fullname= `${row.getValue("firstname")} ${row.getValue("lastname")}`
        return <>{fullname}</>
      }
    },
    
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            email
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
      cell: ({ row }) => {
        const isActive = row.getValue("estActif") as boolean;
        return (
          <Badge
            className={
              isActive
                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      }
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
      // cell: ({ row }) => {
      //   const role = row.getValue("role.name") as string;
      //   return (
      //     <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
      //       {row.getValue("role.name")}
      //     </Badge>
      //   );
      // },
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
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return <>{date.toLocaleDateString()}</>;
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  console.log(users);
  const { onOpen } = useAddUserModal();
  return (
    <>
      <div className="flex justify-between items-center py-4 flex-wrap">
        <Input
          placeholder="Search users..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />

        <Button
          //   disabled={access.creation === "N"}
          variant="default"
          className=""
          onClick={onOpen}
        >
          <ListPlusIcon className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>
      <div
        className={`rounded-md border ${table.getRowModel().rows.length === 0 ? "border-red-500" : ""}`}
      >
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
