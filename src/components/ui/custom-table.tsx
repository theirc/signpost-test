import React, { useState, useMemo, useCallback, useEffect, } from "react"
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, ColumnDef, ColumnOrderState, VisibilityState, getFacetedRowModel, getFacetedUniqueValues, getPaginationRowModel, Header, Cell, ColumnSizingInfoState, } from "@tanstack/react-table"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination"
import { ArrowUpDown, SlidersHorizontal, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, type DragEndEvent, useSensor, useSensors, } from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable, } from "@dnd-kit/sortable"
import { parseISO } from "date-fns"

interface FilterComponentProps<T> {
    data: T[]
    onFilterChange: (filterKey: keyof T, filterValue: any) => void
}

export type FilterValueType = string | (string | number)[]

type FilterDefinition<T> = {
    id?: string
    label: string
    component: React.ComponentType<FilterComponentProps<T>>
    props: any
}

interface CustomTableProps<T extends { id: any }> {
    columns: ColumnDef<T>[]
    data: T[]
    selectedRows?: string[]
    pageSize?: number
    onToggleSelect?: (id: string) => void
    onSelectAll?: () => void
    onRowClick?: (row: T) => void
    tableId?: string
    filters?: FilterDefinition<T>[]
    placeholder?: string
}

const DraggableTableHeader = ({ header, table }: { header: Header<any, unknown>, table: any }) => {
    if (!header || header.id === 'action') {
        return null
    }
    const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({ id: header.column.id })

    const handleDoubleClick = () => {
        const cells = table.getRowModel().rows.map(row => {
            const cell = row.getVisibleCells().find(cell => cell.column.id === header.column.id)
            if (!cell) return null
            return cell.getValue()
        })

        const headerContent = flexRender(header.column.columnDef.header, header.getContext())

        const tempDiv = document.createElement('div')
        tempDiv.style.position = 'absolute'
        tempDiv.style.visibility = 'hidden'
        tempDiv.style.whiteSpace = 'nowrap'
        tempDiv.style.font = window.getComputedStyle(document.body).font
        document.body.appendChild(tempDiv)

        tempDiv.textContent = headerContent as string
        const headerWidth = tempDiv.offsetWidth

        const cellWidths = cells.map(cell => {
            if (!cell) return 0
            tempDiv.textContent = cell.toString()
            return tempDiv.offsetWidth
        })

        document.body.removeChild(tempDiv)

        const maxWidth = Math.max(headerWidth, ...cellWidths)

        const newWidth = maxWidth + 40

        table.setColumnSizing(prev => ({
            ...prev,
            [header.column.id]: newWidth
        }))

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
                        className={`flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer`}
                        onClick={header.column.getToggleSortingHandler()}
                    >
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        <ArrowUpDown className="h-4 w-4" />
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

const safeParseDate = (dateString: string): Date | null => {
    try {
        const date = parseISO(dateString)
        return date
    } catch (error) {
        console.error("Error parsing date:", error)
        return null
    }
}

function CustomTable<T extends { id: any }>({
    columns,
    data,
    selectedRows,
    pageSize = 10,
    onToggleSelect,
    onSelectAll,
    onRowClick,
    tableId,
    filters,
    placeholder
}: CustomTableProps<T>) {
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => {
        const initialOrder = columns?.map((col) => col.id as string).filter(Boolean);
        let finalOrder = initialOrder;
        if (tableId) {
            const stored = localStorage.getItem(`columnOrder-${tableId}`);
            if (stored) {
                try {
                    const parsedOrder = JSON.parse(stored);
                    const validStoredOrder = parsedOrder.filter((id: string | null) => id && initialOrder.includes(id));
                    const selectExists = validStoredOrder.includes('select');
                    
                    if (selectExists) {
                        finalOrder = ['select', ...validStoredOrder.filter(id => id !== 'select')];
                    } else {
                        if (initialOrder.includes('select')) {
                           finalOrder = ['select', ...validStoredOrder];
                        } else {
                           finalOrder = validStoredOrder;
                        }
                    }                    
                } catch (e) {
                    console.error("Failed to parse stored column order:", e);
                    if (initialOrder.includes('select')) {
                         finalOrder = ['select', ...initialOrder.filter(id => id !== 'select')];
                    } else {
                         finalOrder = initialOrder;
                    }
                }
            } else {
                 if (initialOrder.includes('select')) {
                     finalOrder = ['select', ...initialOrder.filter(id => id !== 'select')];
                 } else {
                     finalOrder = initialOrder;
                 }
            }
        } else {
             if (initialOrder.includes('select')) {
                 finalOrder = ['select', ...initialOrder.filter(id => id !== 'select')];
             } else {
                 finalOrder = initialOrder;
             }
        }
        return finalOrder.filter(id => id != null);
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
            enableSorting: true,
        },
        state: { 
            columnOrder,
            columnVisibility, 
            columnSizingInfo,
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        onColumnOrderChange: (newOrder) => {
            if (typeof newOrder === 'function') {
                 setColumnOrder(prev => {
                     const resolvedOrder = newOrder(prev);
                     if (resolvedOrder.includes('select') && resolvedOrder[0] !== 'select') {
                         return ['select', ...resolvedOrder.filter(id => id !== 'select')];
                     }
                     return resolvedOrder;
                 });
            } else {
                if (newOrder.includes('select') && newOrder[0] !== 'select') {
                    setColumnOrder(['select', ...newOrder.filter(id => id !== 'select')]);
                } else {
                    setColumnOrder(newOrder);
                }
            }
        },
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

    useEffect(() => {
        if (tableId) {
            const storedVisibility = localStorage.getItem(`columnVisibility-${tableId}`)
            const visibility = storedVisibility ? JSON.parse(storedVisibility) : {}
            if (visibility['action'] === false) {
                setColumnVisibility(prev => ({ ...prev, action: true }))
            }
        }
    }, [tableId])

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
            setColumnOrder(currentOrder => {
                const oldIndex = currentOrder.indexOf(active.id as string)
                const newIndex = currentOrder.indexOf(over.id as string)
                const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
                // Ensure 'select' remains first after drag
                if (newOrder.includes('select') && newOrder[0] !== 'select') {
                    return ['select', ...newOrder.filter(id => id !== 'select')];
                }
                return newOrder;
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
                    if (key === "created_at") {
                        if (!value.from && !value.to) return true
                        
                        const itemDate = safeParseDate(item[key])
                        if (!itemDate) return false
                        
                        if (value.from && value.to) {
                            const fromDate = new Date(value.from)
                            const toDate = new Date(value.to)
                            fromDate.setHours(0, 0, 0, 0)
                            toDate.setHours(23, 59, 59, 999)
                            return itemDate >= fromDate && itemDate <= toDate
                        }
                        if (value.from && !value.to) {
                            const fromDate = new Date(value.from)
                            fromDate.setHours(0, 0, 0, 0)
                            const itemDateNormalized = new Date(itemDate)
                            itemDateNormalized.setHours(0, 0, 0, 0)
                            return itemDateNormalized.getTime() === fromDate.getTime()
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
    }, [data, filtersState])

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
            <div className="space-y-4">
                <div className="flex items-center justify-between">
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
                <div className="border rounded-md overflow-x-auto w-full">
                    <div className="min-w-full" style={{ width: Math.max(table.getCenterTotalSize(), 800) }}>
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
                                            items={columnOrder}
                                            strategy={horizontalListSortingStrategy}
                                        >
                                            {headerGroup.headers.map((header) => (
                                                <DraggableTableHeader key={header.id} header={header} table={table} />
                                            ))}
                                        </SortableContext>
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {memoizedRows.length ? memoizedRows.map((row) => (
                                    <TableRow 
                                        key={row.id} 
                                        className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
                                                return;
                                            }
                                            onRowClick && onRowClick(row.original);
                                        }}
                                    >
                                        {onToggleSelect && <TableCell className="w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows?.includes(row.getValue("id"))}
                                                onChange={() => onToggleSelect(row.getValue("id"))}
                                                className="rounded border-gray-300"
                                            />
                                        </TableCell>}
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length + (onToggleSelect ? 1 : 0)} className="text-center py-8">
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
