import React, { useState, useMemo, useCallback, useEffect, } from "react"
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, ColumnDef, ColumnOrderState, VisibilityState, getFacetedRowModel, getFacetedUniqueValues, getPaginationRowModel, Header, Cell, ColumnSizingInfoState, } from "@tanstack/react-table"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash, SlidersHorizontal, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, type DragEndEvent, useSensor, useSensors, } from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable, } from "@dnd-kit/sortable"

interface FilterComponentProps<T> {
    data: T[]
    onFilterChange: (filterKey: keyof T, filterValue: any) => void
}

export type FilterValueType = string | (string | number)[]

type FilterDefinition<T> = {
    id: string
    label: string
    component: React.ComponentType<FilterComponentProps<T>>
    props: any
}

interface CustomTableProps<T extends { id: any }> {
    columns: ColumnDef<T>[]
    data: T[]
    selectedRows?: any[]
    pageSize?: number
    onToggleSelect?: (rowId: any) => void
    onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void
    onDelete?: (rowId: any) => void
    onEdit?: (rowId: any) => void
    tableId: string
    filters?: FilterDefinition<T>[]
    placeholder?: string
}

const DraggableTableHeader = ({ header, table }: { header: Header<any, unknown>, table: any }) => {
    if (!header || header.id === 'action') {
        return null
    }
    const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({ id: header.column.id })

    const handleDoubleClick = () => {
        // Get all cells in this column
        const cells = table.getRowModel().rows.map(row => {
            const cell = row.getVisibleCells().find(cell => cell.column.id === header.column.id)
            if (!cell) return null
            return cell.getValue()
        })

        // Get the header content
        const headerContent = flexRender(header.column.columnDef.header, header.getContext())

        // Create temporary elements to measure text width
        const tempDiv = document.createElement('div')
        tempDiv.style.position = 'absolute'
        tempDiv.style.visibility = 'hidden'
        tempDiv.style.whiteSpace = 'nowrap'
        tempDiv.style.font = window.getComputedStyle(document.body).font
        document.body.appendChild(tempDiv)

        // Measure header width
        tempDiv.textContent = headerContent as string
        const headerWidth = tempDiv.offsetWidth

        // Measure all cell widths
        const cellWidths = cells.map(cell => {
            if (!cell) return 0
            tempDiv.textContent = cell.toString()
            return tempDiv.offsetWidth
        })

        // Clean up
        document.body.removeChild(tempDiv)

        // Find the maximum width
        const maxWidth = Math.max(headerWidth, ...cellWidths)

        // Add some padding (40px) to the max width
        const newWidth = maxWidth + 40

        // Update the column size
        table.setColumnSizing(prev => ({
            ...prev,
            [header.column.id]: newWidth
        }))

        // Force a column sizing info update to trigger persistence
        const newSizes = {
            ...table.getState().columnSizing,
            [header.column.id]: newWidth
        }
        
        table.options.onColumnSizingInfoChange?.({
            ...table.getState().columnSizingInfo,
            deltaOffset: 0,
            deltaWidth: 0,
            isResizingColumn: false,
            startOffset: 0,
            startSize: 0,
            columnSizing: newSizes
        })
    }

    return (
        <TableHead
            key={header.id}
            className={`relative overflow-hidden ${isDragging ? "opacity-80 z-[1]" : "opacity-100 z-0"}`}
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
                <div 
                    className="w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                    onDoubleClick={handleDoubleClick}
                >
                    <div
                        className={`flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap ${header.column.getCanSort() ? "cursor-pointer" : ""
                            }`}
                        {...(header.column.getCanSort()
                            ? { onClick: header.column.getToggleSortingHandler() }
                            : {})}
                    >
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {header.column.getCanSort() && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                </div>
                <button {...attributes} {...listeners}>
                    <GripVertical className="h-4 w-4" />
                </button>
                {header.column.getCanResize() && (
                    <div
                        onDoubleClick={handleDoubleClick}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-[2px] cursor-col-resize bg-gray-400 opacity-50 ${
                            header.column.getIsResizing() ? 'bg-blue-500' : ''
                        }`}
                        style={{
                            transform: table.options.columnResizeMode === 'onEnd' && header.column.getIsResizing()
                                ? `translateX(${(table.options.columnResizeDirection === 'rtl' ? -1 : 1) * (table.getState().columnSizingInfo.deltaOffset ?? 0)}px)`
                                : '',
                        }}
                    />
                )}
            </div>
        </TableHead>
    )
}

const DragAlongCell = ({ cell }: { cell: Cell<any, unknown> }) => {
    const { isDragging, setNodeRef, transform } = useSortable({ id: cell.column.id })

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
    filters,
    placeholder
}: CustomTableProps<T>) {
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => {
        if (!tableId) return columns?.map((col) => col.id as string)
        const stored = localStorage.getItem(`columnOrder-${tableId}`)
        return stored ? JSON.parse(stored) : columns?.map((col) => col.id as string)
    })
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
        if (!tableId) return {}
        const stored = localStorage.getItem(`columnVisibility-${tableId}`)
        return stored ? JSON.parse(stored) : {}
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [columnSizingInfo, setColumnSizingInfo] = useState<ColumnSizingInfoState>({} as ColumnSizingInfoState)
    const [columnSizes, setColumnSizes] = useState<Record<string, number>>(() => {
        if (!tableId) return {}
        const stored = localStorage.getItem(`columnSizes-${tableId}`)
        return stored ? JSON.parse(stored) : {}
    })
    const [filtersState, setFiltersState] = useState<Record<string, any>>({})
    const [filteredData, setFilteredData] = useState<T[]>(data)

    const pageCount = Math.ceil(filteredData.length / pageSize)

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        return filteredData?.slice(startIndex, endIndex)
    }, [filteredData, currentPage, pageSize])

    const table = useReactTable<T>({
        data: paginatedData,
        columns,
        defaultColumn: {
            minSize: 40,
            maxSize: 5000,
            size: 150,
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
        columnResizeDirection: "ltr",
        onColumnSizingInfoChange: (updatedColumnSizingInfo: ColumnSizingInfoState) => {
            setColumnSizingInfo(updatedColumnSizingInfo)
            if (!updatedColumnSizingInfo.isResizingColumn) {
                const newSizes = table.getAllLeafColumns()
                    .filter(column => column.id !== 'action')
                    .reduce((acc, column) => {
                        acc[column.id] = column.getSize()
                        return acc
                    }, {} as Record<string, number>)
                setColumnSizes(newSizes)
            }
        },
        initialState: {
            columnSizing: columnSizes
        }
    })

    // Ensure action column is always visible
    useEffect(() => {
        if (tableId) {
            const storedVisibility = localStorage.getItem(`columnVisibility-${tableId}`)
            const visibility = storedVisibility ? JSON.parse(storedVisibility) : {}
            if (visibility['action'] === false) {
                setColumnVisibility(prev => ({ ...prev, action: true }))
            }
        }
    }, [tableId])

    // Optimize column resizing performance
    useEffect(() => {
        if (columnSizingInfo.isResizingColumn) {
            const column = table.getColumn(columnSizingInfo.isResizingColumn)
            if (column) {
                const newSizes = { ...columnSizes }
                newSizes[column.id] = column.getSize()
                setColumnSizes(newSizes)
            }
        }
    }, [columnSizingInfo.isResizingColumn])

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
            setColumnOrder((columnOrder) => {
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

    const applyFilters = useCallback(() => {
        let newFilteredData = data

        Object.entries(filtersState).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                newFilteredData = newFilteredData.filter((item) => {
                    if (key === "date_created") {
                        if (!value.from && !value.to) return true
                        if (value.from && value.to) {
                            const valueDate = new Date(item[key])
                            const fromDate = new Date(value.from)
                            const toDate = new Date(value.to)
                            fromDate.setHours(0, 0, 0, 0)
                            toDate.setHours(23, 59, 59, 999)
                            return valueDate >= fromDate && valueDate <= toDate
                        }
                        if (value.from && !value.to) {
                            const valueDate = new Date(item[key]).setHours(0, 0, 0, 0)
                            const fromDate = new Date(value.from).setHours(0, 0, 0, 0)
                            return valueDate == fromDate
                        }
                        return true
                    } else if (key === "search") {
                        for (const key in item) {
                            if (Object.prototype.hasOwnProperty.call(item, key)) {
                                const val = item[key as keyof T]
                                if (typeof val === "string" &&
                                    val.toLowerCase().includes(value.toLowerCase())) {
                                    return true
                                }
                            }
                        }
                        return false
                    } else if (key === "tags") {
                        return value.every((tag: string) => item[key].includes(tag))
                    } else {
                        return item[key] === value
                    }
                })
            }
        })
        setFilteredData(newFilteredData)
    }, [filtersState, data])

    const handleFilterChange = useCallback(
        (filterKey: string, filterValue: FilterValueType) => {
            setFiltersState((prev) => {
                if (prev[filterKey] === filterValue) return prev
                return { ...prev, [filterKey]: filterValue }
            })
        },
        [setFiltersState]
    )

    useEffect(() => {
        if (!tableId) {
            console.warn("tableId is required to persist column sizes and visibility.")
            return
        }
    }, [tableId])

    // Persist column order
    useEffect(() => {
        if (tableId) {
            try {
                localStorage.setItem(
                    `columnOrder-${tableId}`,
                    JSON.stringify(columnOrder)
                )
            } catch (error) {
                console.error("Error saving column order to localStorage:", error)
            }
        }
    }, [columnOrder, tableId])

    // Persist column visibility
    useEffect(() => {
        if (tableId) {
            try {
                localStorage.setItem(
                    `columnVisibility-${tableId}`,
                    JSON.stringify(columnVisibility)
                )
            } catch (error) {
                console.error("Error saving column visibility to localStorage:", error)
            }
        }
    }, [columnVisibility, tableId])

    // Persist column sizes
    useEffect(() => {
        if (tableId) {
            try {
                localStorage.setItem(
                    `columnSizes-${tableId}`,
                    JSON.stringify(columnSizes)
                )
            } catch (error) {
                console.error("Error saving column sizes to localStorage:", error)
            }
        }
    }, [columnSizes, tableId])

    useEffect(() => {
        applyFilters()
    }, [filtersState, applyFilters])

    const tagFilter = filters?.find(filter => filter.id === "tags")

    return (
        <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
        >
            <div className="flex flex-col gap-4 p-1">
                <div className="flex items-center gap-4 mb-4">
                    {filters?.filter(x => x.id !== "tags").map((filter) => (
                        <filter.component
                            key={filter.id}
                            data={data}
                            onFilterChange={handleFilterChange}
                            {...filter.props}
                        />
                    ))
                    }
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="ml-auto">
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <strong className="flex justify-center">Toggle Columns</strong>
                            {table.getAllLeafColumns().filter(x => x.id !== "action").map((column) => {
                                return (
                                    <DropdownMenuItem
                                        key={column.id}
                                        onSelect={(e) => e.preventDefault()}
                                    >
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
                </div>
                {tagFilter && <div className="flex flex-wrap gap-2 items-center">
                    <tagFilter.component
                        key={tagFilter.id}
                        data={data}
                        onFilterChange={handleFilterChange}
                        {...tagFilter.props}
                    />
                </div>}
                <div className="border rounded-md overflow-x-auto">
                    <div style={{ width: table.getCenterTotalSize() + (onEdit || onDelete ? 80 : 0) }}>
                        <Table>
                            <TableHeader>
                                {memoizedHeaderGroups.map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {onToggleSelect && <TableHead className="w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows?.length === data?.length}
                                                onChange={onSelectAll}
                                                className="rounded border-gray-300"
                                            />
                                        </TableHead>}
                                        <SortableContext
                                            items={columnOrder.filter(id => id !== 'action')}
                                            strategy={horizontalListSortingStrategy}
                                        >
                                            {headerGroup.headers.map((header) => (
                                                <DraggableTableHeader key={header.id} header={header} table={table} />
                                            ))}
                                        </SortableContext>
                                        {(onEdit || onDelete) && (
                                            <TableHead className="w-[80px] min-w-[80px] max-w-[80px] p-0" />
                                        )}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {memoizedRows.length ? memoizedRows.map((row) => (
                                    <TableRow key={row.id}>
                                        {onToggleSelect && <TableCell>
                                            <input
                                                type="checkbox"
                                                checked={selectedRows?.includes(row.original.id)}
                                                onChange={() => handleToggleSelect(row.original.id)}
                                                className="rounded border-gray-300"
                                            />
                                        </TableCell>}
                                        {row.getVisibleCells().map((cell) => (
                                            <SortableContext
                                                key={cell.id}
                                                items={columnOrder.filter(id => id !== 'action')}
                                                strategy={horizontalListSortingStrategy}
                                            >
                                                <DragAlongCell key={cell.id} cell={cell} />
                                            </SortableContext>
                                        ))}
                                        {(onEdit || onDelete) && (
                                            <TableCell className="w-[80px] min-w-[80px] max-w-[80px] p-0">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {onEdit && (
                                                            <DropdownMenuItem onClick={() => onEdit(row.original.id)}>
                                                                <Pencil className="h-4 w-4 mr-2" /> Edit
                                                            </DropdownMenuItem>
                                                        )}
                                                        {onDelete && (
                                                            <DropdownMenuItem
                                                                className="text-red-500 focus:text-red-500"
                                                                onClick={() => onDelete(row.original.id)}
                                                            >
                                                                <Trash className="h-4 w-4 mr-2" /> Delete
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            {placeholder || "No data found"}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                {data?.length > pageSize &&<Pagination>
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
                </Pagination>}
            </div>
        </DndContext>
    )
}

export default CustomTable
