import React, { useState, useMemo, useCallback, useEffect, } from "react"
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, ColumnDef, ColumnOrderState, VisibilityState, getFacetedRowModel, getFacetedUniqueValues, getPaginationRowModel, Header, Cell, ColumnSizingInfoState, } from "@tanstack/react-table"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash, SlidersHorizontal, GripVertical, } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, type DragEndEvent, useSensor, useSensors, } from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable, } from "@dnd-kit/sortable"

interface CustomTableProps<T extends { id: any }> {
    columns: ColumnDef<T>[]
    data: T[]
    selectedRows: any[]
    pageSize?: number
    onToggleSelect: (rowId: any) => void
    onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void
    onDelete?: (rowId: any) => void
    onEdit?: (rowId: any) => void
    tableId: string
}

const DraggableTableHeader = ({
    header,
}: {
    header: Header<any, unknown>
}) => {
    const { attributes, isDragging, listeners, setNodeRef, transform } =
        useSortable({
            id: header.column.id,
        })

    return (
        <TableHead
            key={header.id}
            className={`relative overflow-hidden ${isDragging ? "opacity-80 z-[1]" : "opacity-100 z-0"
                }`}
            colSpan={header.colSpan}
            ref={setNodeRef}
            style={{
                transform: transform
                    ? `translate(${transform.x}px, ${transform.y}px)`
                    : "none",
                width: header.column.getSize(),
                maxWidth: `${header.column.getSize()}px`,
            }}
        >
            <div className="flex w-full items-center justify-between">
                <div className="m-2 w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    <div
                        className={`flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap ${header.column.getCanSort() ? "cursor-pointer" : ""
                            }`}
                        {...(header.column.getCanSort()
                            ? { onClick: header.column.getToggleSortingHandler() }
                            : {})}
                    >
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {header.column.getCanSort() && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                </div>
                <button {...attributes} {...listeners}>
                    <GripVertical className="h-4 w-4" />
                </button>
                {header.column.getCanResize() && (
                    <div
                        onMouseDown={(e) => { header.getResizeHandler()(e) }}
                        onTouchStart={(e) => { header.getResizeHandler()(e) }}
                        className="absolute right-0 top-0 h-full w-[2px] cursor-col-resize bg-gray-400 opacity-50"
                    />
                )}
            </div>
        </TableHead>
    )
}

const DragAlongCell = ({ cell }: { cell: Cell<any, unknown> }) => {
    const { isDragging, setNodeRef, transform } = useSortable({
        id: cell.column.id,
    })

    return (
        <TableCell
            className={`relative overflow-hidden text-ellipsis whitespace-nowrap ${isDragging ? "opacity-80 z-[1]" : "opacity-100 z-0"}`}
            style={{
                transform: transform
                    ? `translate(${transform.x}px, ${transform.y}px)`
                    : "none",
                width: cell.column.getSize(),
                maxWidth: `${cell.column.getSize()}px`,
            }}
            ref={setNodeRef}
        >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
    )
}

function CustomTable<T extends { id: any }>({
    columns,
    data,
    selectedRows,
    pageSize = 10,
    onToggleSelect,
    onSelectAll,
    onDelete,
    onEdit,
    tableId,
}: CustomTableProps<T>) {
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
        columns?.map((col) => col.id as string)
    )
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [currentPage, setCurrentPage] = useState(1)

    const [columnSizingInfo, setColumnSizingInfo] =
        useState<ColumnSizingInfoState>({} as ColumnSizingInfoState)

    const pageCount = Math.ceil(data.length / pageSize)

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        return data.slice(startIndex, endIndex)
    }, [data, currentPage, pageSize])

    const table = useReactTable<T>({
        data: paginatedLogs,
        columns,
        defaultColumn: {
            minSize: 10,
        },
        state: { columnOrder, columnVisibility, columnSizingInfo },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        onColumnOrderChange: setColumnOrder,
        onColumnVisibilityChange: setColumnVisibility,
        columnResizeMode: "onChange",
        onColumnSizingInfoChange: (updatedColumnSizingInfo: ColumnSizingInfoState) => {
            setColumnSizingInfo(updatedColumnSizingInfo)
        },
    })

    const memoizedHeaderGroups = useMemo(
        () => table.getHeaderGroups(),
        [table.getHeaderGroups()]
    )

    const memoizedRows = useMemo(() => table.getRowModel().rows, [
        table.getRowModel().rows,
    ])

    const handleToggleSelect = useCallback(
        (rowId: any) => {
            onToggleSelect(rowId)
        },
        [onToggleSelect]
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (active && over && active.id !== over.id) {
            setColumnOrder(columnOrder => {
                const oldIndex = columnOrder.indexOf(active.id as string)
                const newIndex = columnOrder.indexOf(over.id as string)
                return arrayMove(columnOrder, oldIndex, newIndex)
            })
        }
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    useEffect(() => {
        if (!tableId) {
            console.warn("tableId is required to persist column sizes.")
            return
        }

        const storedColumnSizes = localStorage.getItem(
            `columnSizes-${tableId}`
        )
        if (storedColumnSizes) {
            try {
                setColumnSizingInfo(JSON.parse(storedColumnSizes))
            } catch (error) {
                console.error("Error parsing column sizes from localStorage:", error)
            }
        }
    }, [tableId])

    useEffect(() => {
        if (tableId && columnSizingInfo) {
            try {
                localStorage.setItem(
                    `columnSizes-${tableId}`,
                    JSON.stringify(columnSizingInfo)
                )
            } catch (error) {
                console.error("Error saving column sizes to localStorage:", error)
            }
        }
    }, [columnSizingInfo, tableId])

    return (
        <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
        >
            <div className="flex flex-col items-end overflow-x-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <strong className="flex justify-center">Toggle Columns</strong>
                        {table.getAllLeafColumns().map((column) => {
                            return (
                                <DropdownMenuItem key={column.id} onSelect={(e) => e.preventDefault()}>
                                    <label className="flex items-center gap-2 w-full cursor-pointer">
                                        <input
                                            {...{
                                                type: "checkbox",
                                                checked: column.getIsVisible(),
                                                onChange: column.getToggleVisibilityHandler(),
                                            }}
                                        />
                                        {column.id}
                                    </label>
                                </DropdownMenuItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Table className="border rounded-md">
                    <TableHeader>
                        {memoizedHeaderGroups.map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                <TableHead className="w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.length === data.length}
                                        onChange={onSelectAll}
                                        className="rounded border-gray-300"
                                    />
                                </TableHead>
                                <SortableContext
                                    items={columnOrder}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    {headerGroup.headers.map((header) => (
                                        <DraggableTableHeader key={header.id} header={header} />
                                    ))}
                                </SortableContext>
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {memoizedRows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.includes(row.original.id)}
                                        onChange={() => handleToggleSelect(row.original.id)}
                                        className="rounded border-gray-300"
                                    />
                                </TableCell>
                                {row.getVisibleCells().map((cell) => (
                                    <SortableContext
                                        key={cell.id}
                                        items={columnOrder}
                                        strategy={horizontalListSortingStrategy}
                                    >
                                        <DragAlongCell key={cell.id} cell={cell} />
                                    </SortableContext>
                                ))}
                                {(onEdit || onDelete) && <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {onEdit && <DropdownMenuItem onClick={() => onEdit(row.id)}>
                                                <Pencil className="h-4 w-4 mr-2" /> Edit
                                            </DropdownMenuItem>}
                                            {onDelete && <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => onDelete(row.id)}>
                                                <Trash className="h-4 w-4 mr-2" /> Delete
                                            </DropdownMenuItem>}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Pagination>
                    <PaginationContent>
                        {currentPage === 1 ? (
                            <span aria-disabled="true">
                                <PaginationPrevious />
                            </span>
                        ) : (
                            <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                        )}

                        {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    onClick={() => handlePageChange(page)}
                                    isActive={currentPage === page}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}

                        {currentPage === pageCount ? (
                            <span aria-disabled="true">
                                <PaginationNext />
                            </span>
                        ) : (
                            <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                        )}
                    </PaginationContent>
                </Pagination>
            </div>
        </DndContext>
    )
}

export default CustomTable
