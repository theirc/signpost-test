import { Tag, X } from 'lucide-react'
import React, { useState, useMemo, useCallback } from 'react'
import { FilterValueType } from './custom-table'

interface TagsFilterProps<T> {
  data: T[]
  onFilterChange: (filterKey: keyof T, filterValue: FilterValueType) => void
  filterKey: keyof T
  options?: (string | number)[]
  placeholder?: string
}

export default function TagsFilter<T>({
  data,
  onFilterChange,
  filterKey,
  options = [],
}: TagsFilterProps<T>) {
  const [selectedValue, setSelectedValue] = useState<(string | number)[]>([])
  type StringOrNumber = string | number

  const uniqueValues = useMemo(() => {
    const initialValues: StringOrNumber[] =
      options.length > 0 ? options : []

    if (!data || !Array.isArray(data)) {
      return [...new Set(initialValues)]
    }

    const extractedValues = data.reduce<StringOrNumber[]>((acc, item) => {
      const filterValues = item[filterKey] as
        | StringOrNumber[]
        | undefined
        | null

      if (Array.isArray(filterValues)) {
        return acc.concat(filterValues)
      }

      if (filterValues != null) {
        return acc.concat([filterValues])
      }

      return acc
    }, [])

    return [...new Set([...initialValues, ...extractedValues])]
  }, [data, filterKey, options])

  const toggleTag = useCallback(
    (tag: StringOrNumber) => {
      setSelectedValue((prev) => {
        const newValue = prev.includes(tag)
          ? prev.filter((t) => t !== tag)
          : [...prev, tag]

        onFilterChange(filterKey, newValue)
        return newValue
      })
    },
    [filterKey, onFilterChange]
  )

  const isTagSelected = useCallback(
    (tag: StringOrNumber) => selectedValue.includes(tag),
    [selectedValue]
  )

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Tag className="h-4 w-4 text-muted-foreground" />
      {uniqueValues.map((tag) => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors ${
            isTagSelected(tag)
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          {tag}
          {isTagSelected(tag) && <X className="h-3 w-3" />}
        </button>
      ))}
    </div>
  )
}
