import React, { useState, useMemo, useRef } from "react"
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState, RowSelectionState, ColumnOrderState } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Settings2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, type DragEndEvent, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable"

interface EnhancedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  showColumnToggle?: boolean
  showPagination?: boolean
  onRowClick?: (row: TData) => void
  pageSize?: number
  page?: number
  pageCount?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onFilter?: (filters: ColumnFiltersState) => void
  className?: string
  placeholder?: string
  onSort?: (columnId: string, direction: 'asc' | 'desc' | undefined) => void
  sorting?: SortingState
}

// Draggable header component
const DraggableTableHeader = ({ header, table }: { header: any, table: any }) => {
  if (!header || header.id === 'select') {
    return (
      <TableHead key={header.id}>
        {header.isPlaceholder
          ? null
          : flexRender(
              header.column.columnDef.header,
              header.getContext()
            )}
      </TableHead>
    )
  }

  const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({ id: header.column.id })

  return (
    <TableHead
      key={header.id}
      className={`relative overflow-hidden cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-80 z-[1]' : 'opacity-100 z-0'}`}
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate(${transform.x}px, ${transform.y}px)`
          : 'none',
      }}
      {...attributes}
      {...listeners}
    >
      <div className="flex w-full items-center justify-between">
        <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {flexRender(header.column.columnDef.header, header.getContext())}
        </div>
      </div>
    </TableHead>
  )
}

// Add custom style for datatable-checkbox
const checkboxCustomStyle = `
  .datatable-checkbox[data-state="checked"] {
    --tw-ring-color: #6386F7 !important;
    border-color: #6386F7 !important;
    background-color: #63867 !important;
  }
  .datatable-checkbox[data-state="checked"] svg {
    color: #fff !important;
  }
  .datatable-checkbox {
    border-color: #6386F7 !important;
  }
`;

if (typeof window !== 'undefined' && !document.getElementById('datatable-checkbox-style')) {
  const style = document.createElement('style');
  style.id = 'datatable-checkbox-style';
  style.innerHTML = checkboxCustomStyle;
  document.head.appendChild(style);
}

export function EnhancedDataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  showColumnToggle = true,
  showPagination = true,
  onRowClick,
  pageSize: propPageSize = 10,
  page: controlledPage,
  pageCount: controlledPageCount,
  onPageChange,
  onPageSizeChange,
  onFilter,
  placeholder = "No results.",
  className,
  onSort,
  sorting: controlledSorting
}: EnhancedDataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const sorting = controlledSorting !== undefined ? controlledSorting : internalSorting
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [internalPage, setInternalPage] = useState(0)
  const [internalPageSize, setInternalPageSize] = useState(propPageSize)
  const [searchValue, setSearchValue] = useState("")
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const page = controlledPage !== undefined ? controlledPage : internalPage
  const pageSize = propPageSize !== undefined ? propPageSize : internalPageSize

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const tableColumns = useMemo(() => {
    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          className="datatable-checkbox"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected())
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            className="datatable-checkbox"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    }
    return [selectionColumn, ...columns]
  }, [columns])

  const table = useReactTable({
    data,
    columns: tableColumns,
    onSortingChange: (updater) => {
      let nextSorting: SortingState;
      if (typeof updater === 'function') {
        nextSorting = updater(sorting ?? [])
      } else {
        nextSorting = updater
      }
      if (onSort) {
        const sort = nextSorting[0]
        onSort(sort?.id, sort?.desc === undefined ? undefined : (sort.desc ? 'desc' : 'asc'))
      } else {
        setInternalSorting(nextSorting)
      }
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    state: {
      sorting: sorting ?? [],
      columnFilters,
      columnVisibility,
      rowSelection,
      columnOrder,
      pagination: {
        pageIndex: page,
        pageSize: pageSize,
      },
    },
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
      columnOrder: columnOrder.length > 0 ? columnOrder : undefined,
    },
    manualPagination: controlledPage !== undefined,
    pageCount: controlledPageCount,
    meta: { onSort },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = table.getAllColumns().findIndex(col => col.id === active.id)
      const newIndex = table.getAllColumns().findIndex(col => col.id === over?.id)
      
      // Don't allow moving the select column
      if (active.id === 'select' || over?.id === 'select') return
      
      // Get current column order or create from current state
      const currentOrder = columnOrder.length > 0 
        ? columnOrder 
        : table.getAllColumns().map(col => col.id)
      
      const newColumnOrder = arrayMove(currentOrder, oldIndex, newIndex)
      
      setColumnOrder(newColumnOrder)
    }
  }

  // Export selected rows to CSV
  const exportToCSV = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) return

    // Get visible columns (excluding the select column)
    const visibleColumns = table.getAllColumns().filter(column => 
      column.getIsVisible() && column.id !== 'select'
    )

    // Create CSV header
    const headers = visibleColumns.map(column => {
      const header = column.columnDef.header
      if (typeof header === 'string') return header
      if (typeof header === 'function') {
        // For complex headers, use column id as fallback
        return column.id.charAt(0).toUpperCase() + column.id.slice(1)
      }
      return column.id.charAt(0).toUpperCase() + column.id.slice(1)
    })

    // Create CSV rows
    const csvRows = selectedRows.map(row => {
      return visibleColumns.map(column => {
        const value = row.getValue(column.id)
        // Handle different value types
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') return JSON.stringify(value)
        return String(value)
      })
    })

    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `export-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className={className}>
      {/* Search and Column Toggle */}
      <div className="flex items-center py-4">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value)
              if (onFilter) {
                if (debounceRef.current) clearTimeout(debounceRef.current)
                debounceRef.current = setTimeout(() => {
                  onFilter([{ id: searchKey, value: event.target.value }])
                }, 400)
              } else {
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
            }}
            className="max-w-sm rounded-full"
          />
        )}
        <div className="ml-auto flex items-center gap-2">
          {selectedRowCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4"/>
              Export ({selectedRowCount})
            </Button>
          )}
          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  <Settings2 className="mr-2 h-4 w-4"/>
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" && column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <SortableContext
                items={table.getHeaderGroups()[0]?.headers.map(header => header.id) || []}
                strategy={horizontalListSortingStrategy}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="h-12">
                    {headerGroup.headers.map((header) => (
                      <DraggableTableHeader key={header.id} header={header} table={table} />
                    ))}
                  </TableRow>
                ))}
              </SortableContext>
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => onRowClick?.(row.original)}
                    className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="h-12 py-0">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="h-12">
                  <TableCell
                    colSpan={tableColumns.length}
                    className="h-24 text-center"
                  >
                    {placeholder}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-muted-foreground flex-1 text-sm">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  if (onPageSizeChange) {
                    onPageSizeChange(Number(value))
                  } else {
                    setInternalPageSize(Number(value))
                    setInternalPage(0)
                  }
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={`${pageSize}`} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {page + 1} of {controlledPageCount ?? table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="hidden h-8 w-8 lg:flex"
                onClick={() => onPageChange ? onPageChange(0) : setInternalPage(0)}
                disabled={page === 0}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4"/>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange ? onPageChange(page - 1) : setInternalPage(page - 1)}
                disabled={page === 0}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4"/>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange ? onPageChange(page + 1) : setInternalPage(page + 1)}
                disabled={controlledPageCount ? page + 1 >= controlledPageCount : !table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4"/>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden h-8 w-8 lg:flex"
                onClick={() => onPageChange ? onPageChange((controlledPageCount ?? table.getPageCount()) - 1) : setInternalPage((controlledPageCount ?? table.getPageCount()) - 1)}
                disabled={controlledPageCount ? page + 1 >= controlledPageCount : !table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4"/>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 