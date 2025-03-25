import { Search } from "lucide-react"
import React, { useState, useCallback } from "react"
import { Input } from "./input"

interface SearchFilterProps<T> {
    data: T[]
    onFilterChange: (filterKey: keyof T, filterValue: string) => void
    filterKey: keyof T
    placeholder?: string
}

export default function SearchFilter<T>({
    onFilterChange,
    filterKey,
    placeholder = "Search..."
}: SearchFilterProps<T>) {
    const [searchTerm, setSearchTerm] = useState("")

    const handleOnChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchTerm(value)
        onFilterChange(filterKey, value)
    }, [onFilterChange, filterKey])

    return (
        <div className="flex-1 relative w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={searchTerm}
                onChange={handleOnChange}
                className="pl-8"
            />
        </div>
    )
}
