import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    ColumnDef,
    ColumnOrderState,
    VisibilityState,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getPaginationRowModel,
    Header,
    Cell,
} from "@tanstack/react-table"
import { useState, useMemo, useCallback, CSSProperties } from "react"
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination"
import {
    ArrowUpDown,
    MoreHorizontal,
    Pencil,
    Trash,
    SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import React from "react"
import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    type DragEndEvent,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
    arrayMove,
    SortableContext,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'

interface CustomTableProps<T extends { id: any }> {
    columns: ColumnDef<T>[]
    data: T[]
    selectedRows: any[]
    pageSize?: number
    onToggleSelect: (rowId: any) => void
    onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void
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

    const style: CSSProperties = {
        opacity: isDragging ? 0.8 : 1,
        position: "relative",
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : "none",
        transition: "width transform 0.2s ease-in-out",
        width: header.column.getSize(),
        maxWidth: header.column.getSize(),
        overflow: "hidden",
        zIndex: isDragging ? 1 : 0,
    }

    return (
        <TableHead key={header.id} className="relative" colSpan={header.colSpan} ref={setNodeRef} style={style}>
            <div className="flex w-full items-center justify-between overflow-hidden text-ellipsis whitespace-nowrap">
                <div className="m-2 w-full">
                    <div
                        className={`flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap ${
                            header.column.getCanSort() ? "cursor-pointer" : ""
                        }`}
                        {...(header.column.getCanSort()
                            ? { onClick: header.column.getToggleSortingHandler() }
                            : {})}
                    >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                </div>
                <button {...attributes} {...listeners}>
                    🟰
                </button>
                {header.column.getCanResize() && (
                    <div
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            header.getResizeHandler()(e);
                        }}
                        onTouchStart={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            header.getResizeHandler()(e);
                        }}
                        className="absolute right-0 top-0 h-full w-[1px] cursor-col-resize bg-gray-400 opacity-50"
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

    const style: CSSProperties = {
        opacity: isDragging ? 0.8 : 1,
        position: 'relative',
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : 'none',
        transition: 'width transform 0.2s ease-in-out',
        width: cell.column.getSize(),
        maxWidth: cell.column.getSize(),
        zIndex: isDragging ? 1 : 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    }

    return (
        <TableCell style={style} ref={setNodeRef}>
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
}: CustomTableProps<T>) {
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
        columns?.map((col) => col.id as string)
    )
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [currentPage, setCurrentPage] = useState(1)

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
            minSize: 0
        },
        state: { columnOrder, columnVisibility },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        onColumnOrderChange: setColumnOrder,
        onColumnVisibilityChange: setColumnVisibility,
        columnResizeMode: "onChange",
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

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    return (
        <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
        >
            <div className="flex flex-col items-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <strong>Toggle Columns</strong>
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
                                <TableHead>Actions</TableHead>
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
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Pencil className="h-4 w-4 mr-2" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-500 focus:text-red-500">
                                                <Trash className="h-4 w-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
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
