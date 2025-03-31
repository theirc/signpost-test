import React, { useState, useMemo } from "react"

interface SelectFilterProps<T> {
    data: T[]
    onFilterChange: (filterKey: keyof T, filterValue: string) => void
    filterKey: keyof T
    options?: (string | number)[]
    placeholder?: string
}

export default function SelectFilter<T>({
    data,
    onFilterChange,
    filterKey,
    options = [],
    placeholder = "All"
}: SelectFilterProps<T>) {
    const [selectedValue, setSelectedValue] = useState<string | number>("")

    const uniqueValues = useMemo(
        () => options.length > 0 ? options : [...new Set(data.map((item) => item[filterKey]))],
        [data, filterKey, options]
    ) as (string | number)[]

    return (
        <select
            value={selectedValue}
            className="px-3 py-2 rounded-md border"
            onChange={(e) => {
                const value = e.target.value
                setSelectedValue(value)
                onFilterChange(filterKey, value)
            }}
        >
            <option value="">{placeholder}</option>
            {uniqueValues.map((value) => (
                <option key={String(value)} value={String(value)}>
                    {value}
                </option>
            ))}
        </select>
    )
}
