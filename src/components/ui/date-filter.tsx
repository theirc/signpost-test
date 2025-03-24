import React, { useState, useEffect } from "react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface DateFilterProps<T> {
    data: T[]
    onFilterChange: (filterKey: keyof T, filterValue: { from: Date | null; to: Date | null }) => void
    filterKey: keyof T
}

export default function DateFilter<T>({ data, onFilterChange, filterKey }: DateFilterProps<T>) {
    const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
        from: null,
        to: null,
    })

    useEffect(() => {
        if (!dateRange.from && !dateRange.to) {
            onFilterChange(filterKey, {from: null, to: null})
            return
        }

        onFilterChange(filterKey, {from: dateRange.from, to: dateRange.to})
    }, [dateRange, filterKey, onFilterChange])

    const formatDateRange = () => {
        if (!dateRange) {
            return "Pick a date"
        }

        if (dateRange.from && dateRange.to) {
            return `${format(dateRange.from, "MMM dd, yyyy")} - ${format(
                dateRange.to,
                "MMM dd, yyyy"
            )}`
        }

        if (dateRange.from) {
            return format(dateRange.from, "MMM dd, yyyy")
        }

        return "Pick a date"
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                        "w-[300px] justify-start text-left font-normal",
                        !dateRange?.from && "text-muted-foreground"
                    )}
                >
                    {formatDateRange()}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0"
                align="start"
                side="bottom"
            >
                <Calendar
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => {
                        setDateRange({
                            from: range?.from || null,
                            to: range?.to || null,
                        })
                    }}
                    numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>
    )
}
