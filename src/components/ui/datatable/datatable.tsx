import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { useEffect, useMemo, useState } from "react"
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, PaginationState, SortingState, VisibilityState, ColumnFiltersState, useReactTable, TableOptions, ColumnSort, } from "@tanstack/react-table"
import { ChevronDownIcon, ChevronUpIcon, GripVerticalIcon, ChevronsUpDownIcon, MoreHorizontal, ChevronFirstIcon, ChevronLeftIcon, ChevronRightIcon, ChevronLastIcon, Columns3, SearchIcon, RefreshCcw } from "lucide-react"
import { CSSProperties, useId } from "react"
import { closestCenter, DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, } from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable, } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Cell, Header, } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { EmptyData } from "./empty"
import React from "react"
import { Skeleton } from "../skeleton"
import { format } from 'date-fns'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../accordion"


declare global {
  type Column<T, M> = ColumnDef<T, M>
  type Columns<T = any> = { [key in keyof T]?: Column<T, T[key]> }
  type PaginationData = PaginationState
}
export interface DataTableProps<T = any> extends Omit<React.HTMLAttributes<HTMLDivElement>, "onLoad"> {
  data?: T[]
  columns?: Columns<T>
  hideSelection?: boolean
  hideActions?: boolean
  onRowClick?: (row: T) => void
  onLoad?: (state: PaginationState) => Promise<T[]>
  onPaginationChange?: (state: PaginationState) => void
  showSearch?: boolean
  showColumnSelection?: boolean
  showPagination?: boolean
  total?: number
  loading?: boolean
  sort?: [string, "asc" | "desc"]
}


export function DataTable<T = any>(props: DataTableProps<T>) {

  let {
    hideSelection,
    hideActions,
    columns,
    onRowClick,
    loading,
    showSearch = true,
    showColumnSelection = true,
    showPagination = true,
    sort,
  } = props

  const sortingState: SortingState = sort ? [{ id: sort[0], desc: sort[1] == "desc" }] : []

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20, })
  const [data, setData] = useState<any[]>(props.data)

  const cols = useMemo(() => {
    const gen: ColumnDef<any>[] = []
    Object.entries(columns).forEach(([k, v]) => {
      const cd = { ...(v as any) } as ColumnDef<any>
      cd.id ||= k
      cd["accessorKey"] ||= cd.id
      gen.push(cd)
    })
    return gen
  }, [columns])

  const [searchQuery, setSearchQuery] = useState<string>()
  const [globalFilter, setGlobalFilter] = useState<string>("")
  const [sorting, setSorting] = useState<SortingState>(sortingState)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnOrder, setColumnOrder] = useState<string[]>(cols.map((column) => column.id as string))
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}))


  useEffect(() => {
    async function loadData() {
      const data = await props.onLoad(pagination)
      setData(data)
    }
    if (props.onLoad) loadData()
  }, [])

  useEffect(() => {
    setData(props.data || [])
  }, [props.data])

  useEffect(() => {
    props.onPaginationChange && (props.onPaginationChange(table.getState().pagination))
  }, [pagination.pageIndex, pagination.pageSize])

  const options: TableOptions<any> = {
    data: data || [],
    columns: cols,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnOrder,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter,
    },
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    enableSortingRemoval: true,
    getRowId: (row) => row.id || String(Math.random()),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  }

  if (props.total !== undefined) {
    delete options.getPaginationRowModel
    options.manualPagination = true
    options.rowCount = props.total
  }

  const table = useReactTable(options)

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (active && over && active.id !== over.id) {
      setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string)
        const newIndex = columnOrder.indexOf(over.id as string)
        return arrayMove(columnOrder, oldIndex, newIndex)
      })
    }
  }

  let Empty = <EmptyData />

  if (props.children) {
    React.Children.forEach(props.children, (child) => {
      if (!React.isValidElement(child)) return
      if (child.type === EmptyData) Empty = child as any
    })
  }

  const selectionColumnWidth = !hideSelection ? 48 : 0 // 48px for w-12
  const actionsColumnWidth = !hideActions ? 48 : 0 // 48px for w-12

  const rows = table.getRowModel().rows || []
  const allCheckedStatus = table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false
  let tbody = Empty

  if (loading) {
    tbody = <TableBody>
      {Array.from({ length: pagination.pageSize }, (_, i) => i + 1).map((row, id) => (
        <TableRow key={id}>
          {table.getAllColumns().map((cell, i) => (
            <TableCell key={i} className="truncate px-2 py-2" >
              <Skeleton className="h-8 w-full rounded-md" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  } else {
    if (rows.length > 0) {
      tbody = <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} onClick={() => onRowClick?.(row.original)} className={onRowClick ? "cursor-pointer" : undefined}>

            {!hideSelection && <TableCell className="p-0 pl-4 w-12 sticky left-0 bg-background z-10" onClick={(e) => e.stopPropagation()} >
              <div className="absolute top-0 left-0 w-full h-full border-r text-center pt-2">
                <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
              </div>
            </TableCell>}

            {row.getVisibleCells().map((cell) => (
              <SortableContext key={cell.id} items={columnOrder} strategy={horizontalListSortingStrategy}>
                <DragAlongCell key={cell.id} cell={cell} />
              </SortableContext>
            ))}

            {!hideActions && <TableCell className="p-0 pl-4 w-10 sticky right-0 bg-background z-10" onClick={(e) => e.stopPropagation()} >
              <div className="absolute top-0 right-0 bottom-0 w-full h-full border-l pl-3 pt-2">
                <Button size="icon" variant="ghost" className="size-6">
                  <MoreHorizontal size={16} />
                </Button>
              </div>
            </TableCell>}

          </TableRow>
        ))}
      </TableBody>
    }
  }

  return <div className="grid grid-rows-[auto,100fr,1fr] w-full h-full pb-4 min-h-0">
    {(showSearch || showColumnSelection) && <div className="pb-2 flex items-center gap-2">
      {showSearch && <Input placeholder="Search..." value={globalFilter ?? ""} onChange={(event) => setGlobalFilter(event.target.value)} className="max-w-sm rounded-full h-8" />}
      <div className="grow"></div>
      {showColumnSelection && <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-auto">
              {/* <Columns3 />Columns<ChevronDownIcon /> */}
              <Columns3 /><ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="relative">
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" placeholder="Search" onKeyDown={(e) => e.stopPropagation()} />
              <SearchIcon className="absolute inset-y-0 my-auto left-2 h-4 w-4" />
            </div>
            <DropdownMenuSeparator />
            {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => {
              if (searchQuery && !column.id.toLowerCase().includes(searchQuery.toLowerCase())) return null
              return <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={(e) => e.preventDefault()}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              table.resetColumnVisibility()
              setSearchQuery("")
            }}>
              <RefreshCcw /> Reset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>}
    </div>}

    <DndContext id={useId()} collisionDetection={closestCenter} modifiers={[restrictToHorizontalAxis]} onDragEnd={handleDragEnd} sensors={sensors}>
      <Table className="table-fixed" style={{ width: table.getCenterTotalSize() + selectionColumnWidth + actionsColumnWidth }}>
        <TableHeader>
          <TableRow className="[&>*]:whitespace-nowrap sticky top-0 bg-muted hover:bg-muted z-30 outline outline-1 outline-sidebar-border -outline-offset-0" >
            {!hideSelection && <TableHead className="w-10 sticky left-0 bg-muted z-40 border-r h-8 whitespace-nowrap px-3 pt-1">
              <Checkbox checked={allCheckedStatus} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />
            </TableHead>}
            <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
              {table.getFlatHeaders().map((header) => <DraggableTableHeader key={header.id} header={header} />)}
            </SortableContext>
            {!hideActions && <TableHead className="w-10 sticky right-0 bg-muted z-40 border-l h-8 whitespace-nowrap">
            </TableHead>}
          </TableRow>
        </TableHeader>
        {tbody}
      </Table>
    </DndContext>

    {showPagination && <div className="flex items-center justify-between gap-4 pt-2">

      <div className="flex items-center">
        <Label className="max-sm:sr-only">
          Rows per page
        </Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-fit whitespace-nowrap">
              {table.getState().pagination.pageSize}
              <ChevronDownIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => table.setPageSize(10)}>10</DropdownMenuItem>
            <DropdownMenuItem onClick={() => table.setPageSize(20)}>20</DropdownMenuItem>
            <DropdownMenuItem onClick={() => table.setPageSize(30)}>30</DropdownMenuItem>
            <DropdownMenuItem onClick={() => table.setPageSize(40)}>40</DropdownMenuItem>
            <DropdownMenuItem onClick={() => table.setPageSize(50)}>50</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
        <p className="text-muted-foreground text-sm whitespace-nowrap" aria-live="polite">
          <span className="text-foreground">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            -
            {Math.min(Math.max(table.getState().pagination.pageIndex * table.getState().pagination.pageSize + table.getState().pagination.pageSize, 0), table.getRowCount())}
          </span>
          {" of "}
          <span className="text-foreground">
            {table.getRowCount().toString()}
          </span>
        </p>
      </div>

      <div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button size="icon" variant="outline" className="disabled:pointer-events-none disabled:opacity-50" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage() || loading} aria-label="Go to first page">
                <ChevronFirstIcon size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button size="icon" variant="outline" className="disabled:pointer-events-none disabled:opacity-50" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage() || loading} aria-label="Go to previous page">
                <ChevronLeftIcon size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button size="icon" variant="outline" className="disabled:pointer-events-none disabled:opacity-50" onClick={() => table.nextPage()} disabled={!table.getCanNextPage() || loading} aria-label="Go to next page">
                <ChevronRightIcon size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button size="icon" variant="outline" className="disabled:pointer-events-none disabled:opacity-50" onClick={() => table.lastPage()} disabled={!table.getCanNextPage() || loading} aria-label="Go to last page">
                <ChevronLastIcon size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>}

  </div>


}


function DraggableTableHeader({ header, }: { header: Header<any, unknown> }) {

  const { attributes, isDragging, listeners, setNodeRef, transform, transition, } = useSortable({ id: header.column.id, })

  const isSorted = header.column.getIsSorted()
  const { isPlaceholder, column } = header

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition,
    whiteSpace: "nowrap",
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  }

  return <TableHead ref={setNodeRef} className="group relative h-8 before:absolute before:inset-y-0 before:start-0 before:w-px first:before:bg-transparent select-none" style={style}>
    <div className="flex items-center justify-start gap-2">
      <span className="grow truncate -ml-1" {...attributes} {...listeners}>{isPlaceholder ? null : flexRender(column.columnDef.header, header.getContext())}</span>
      <Button size="icon" variant="ghost" className="group -mr-1 size-4 shadow-none"
        onClick={() => {
          const currentSort = isSorted
          if (currentSort === false) {
            column.toggleSorting(false)
          } else if (currentSort === "asc") {
            column.toggleSorting(true)
          } else {
            column.clearSorting()
          }
        }}
        onKeyDown={(e) => {
          if (column.getCanSort() &&
            (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            const currentSort = isSorted
            if (currentSort === false) {
              column.toggleSorting(false)
            } else if (currentSort === "asc") {
              column.toggleSorting(true)
            } else {
              column.clearSorting()
            }
          }
        }}
      >
        {isSorted === "asc" && <ChevronUpIcon className="shrink-0 opacity-60" size={16} aria-hidden="true" />}
        {isSorted === "desc" && <ChevronDownIcon className="shrink-0 opacity-60" size={16} aria-hidden="true" />}
        {isSorted === false && <div className="shrink-0 opacity-0 group-hover:opacity-60" aria-hidden="true"><ChevronsUpDownIcon size={16} /></div>}
      </Button>
    </div>
    {column.getCanResize() && (
      <div
        {...{
          onDoubleClick: () => column.resetSize(),
          onMouseDown: header.getResizeHandler(),
          onTouchStart: header.getResizeHandler(),
          className: "absolute top-0 h-full w-4 cursor-col-resize user-select-none touch-none -right-2 z-10 flex justify-center before:absolute before:w-px before:inset-y-0 before:bg-border before:translate-x-px",
        }}
      />
    )}
  </TableHead>

}

function DragAlongCell({ cell }: { cell: Cell<any, unknown> }) {

  const { isDragging, setNodeRef, transform, transition } = useSortable({ id: cell.column.id, })

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition,
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  }

  return <TableCell ref={setNodeRef} className="truncate px-2 py-2" style={style}>
    {flexRender(cell.column.columnDef.cell, cell.getContext())}
  </TableCell>
}



const numberFormatter = new Intl.NumberFormat()

DataTable.cellRender = {
  date: ({ row, column }) => format(row.original[column.id], "MM/dd/yyyy hh:mm:ss"),
  json: ({ row, column }) => {
    const content = JSON.stringify(row.original[column.id], null, 2)
    return <Accordion type="single" collapsible >
      <AccordionItem value={column.id}>
        <AccordionTrigger className="bg-slate-100 p-2 overflow-hidden rounded-md" >Data</AccordionTrigger>
        <AccordionContent >
          <pre className="bg-slate-100 p-2 overflow-hidden rounded-md">{content}</pre>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  },
  number: ({ row, column }) => {
    const value = Number(row.original[column.id]) || 0

    return <div className=" text-right tabular-nums">{numberFormatter.format(value)}</div>
  },
}