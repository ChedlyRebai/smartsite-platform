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
<<<<<<< HEAD
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
=======
import {  useState } from "react";
import { Input } from "@/components/ui/input";

>>>>>>> origin/main
import {
  ArrowUpDown,
  ListPlusIcon,
  SearchIcon,
  Edit,
  Trash2,
} from "lucide-react";
import { Permission } from "@/app/types";
<<<<<<< HEAD
import { toast } from "sonner";
=======

>>>>>>> origin/main
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { access } from "fs";

interface PermissionsDataTableProps {
  permissions: Permission[];
  onEdit?: (permission: Permission) => void;
  onDelete?: (permissionId: string) => void;
  onAddNew?: () => void;
}

export function PermissionsDataTable({
  permissions,
  onEdit,
  onDelete,
  onAddNew,
}: PermissionsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<Permission>[] = [
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
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Permission Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("name")}</div>;
      },
    },
<<<<<<< HEAD
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        return (
          <div className="text-sm text-gray-600">
            {row.getValue("source") || "source"}
          </div>
        );
      },
    },
=======
    
>>>>>>> origin/main
    {
      accessorKey: "access",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            access
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          // <span
          //   className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-lg font-medium ${
          //     row.getValue("acces") === "O"
          //       ? "bg-green-100 text-green-800"
          //       : "bg-red-100 text-red-800"
          //   } `}
          // >
          //   {row.getValue("acces") === "O" ? "Oui" : "Non"}
          // </span>
          <Select
            // disabled={access.modification === "N"}

            defaultValue={row.getValue("access")}
          >
           
            <SelectTrigger
              className={` w-fit ${
                row.getValue("access") == "1"
                  ? "border-green-500"
                  : "border-red-500"
              }`}
            > {row.getValue("access") === "1" ? "Oui" : "Non"}
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="1">Oui</SelectItem>
                <SelectItem value="0">Non</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "create",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            access
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          // <span
          //   className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-lg font-medium ${
          //     row.getValue("acces") === "O"
          //       ? "bg-green-100 text-green-800"
          //       : "bg-red-100 text-red-800"
          //   } `}
          // >
          //   {row.getValue("acces") === "O" ? "Oui" : "Non"}
          // </span>
          <Select
            // disabled={access.modification === "N"}

            defaultValue={row.getValue("create")}
          >
           
            <SelectTrigger
              className={` w-fit ${
                row.getValue("create") == "1"
                  ? "border-green-500"
                  : "border-red-500"
              }`}
            > {row.getValue("create") === "1" ? "Oui" : "Non"}
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="1">Oui</SelectItem>
                <SelectItem value="0">Non</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "update",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Update
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          // <span
          //   className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-lg font-medium ${
          //     row.getValue("acces") === "O"
          //       ? "bg-green-100 text-green-800"
          //       : "bg-red-100 text-red-800"
          //   } `}
          // >
          //   {row.getValue("acces") === "O" ? "Oui" : "Non"}
          // </span>
          <Select
            // disabled={access.modification === "N"}

            defaultValue={row.getValue("update")}
          >
          
            <SelectTrigger
              className={` w-fit ${
                row.getValue("update") == "1"
                  ? "border-green-500"
                  : "border-red-500"
              }`}
            >  {row.getValue("update") === "1" ? "Oui" : "Non"}
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="1">Oui</SelectItem>
                <SelectItem value="0">Non</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "delete",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Delete
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
        <>
           {/* <span
             className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-lg font-medium ${
               row.getValue("acces") === "O"
                 ? "bg-green-100 text-green-800"

                 : "bg-red-100 text-red-800"
             } `}
           >
             {row.getValue("delete") === "1" ? "Oui" : "Non"}
           </span> */}
          <Select
            // disabled={access.modification === "N"}

            defaultValue={row.getValue("delete")}
          >
            <SelectTrigger
              className={` w-fit ${
                row.getValue("delete") == "1"
                  ? "border-green-500"
                  : "border-red-500"
              }`}
            >{row.getValue("delete") === "1" ? "Oui" : "Non"}
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="1">Oui</SelectItem>
                <SelectItem value="0">Non</SelectItem>
              </SelectGroup>
              
            </SelectContent>
          </Select>
          </>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        return (
          <div className="text-sm text-gray-600 max-w-md truncate">
            {row.getValue("description") || "No description"}
          </div>
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
            Created At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(permission)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (
                    confirm(
                      `Are you sure you want to delete permission "${permission.name}"?`,
                    )
                  ) {
                    onDelete(permission._id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: permissions,
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

  return (
    <>
      <div className="flex justify-between items-center py-4 flex-wrap gap-4">
        <Input
          placeholder="Search permissions..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        {onAddNew && (
          <Button onClick={onAddNew} variant="default">
            <ListPlusIcon className="mr-2 h-4 w-4" />
            Add New Permission
          </Button>
        )}
      </div>
      <div className="rounded-md border">
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
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No permissions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </>
  );
}
