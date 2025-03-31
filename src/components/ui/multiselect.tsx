import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from '@radix-ui/react-checkbox'
import { X } from "lucide-react"

export interface Option {
    label: string
    value: string
  }
  
  export function MultiSelectDropdown({
    options,
    selected,
    onChange,
  }: {
    options: Option[]
    selected: number[]
    onChange: (selected: number[]) => void
  }) {
    const removeBot = (botValue: number) => {
      onChange(selected.filter((v) => v !== botValue))
    }
  
    const toggleSelection = (botValue: number) => {
      if (selected.includes(botValue)) {
        removeBot(botValue)
      } else if (selected.length < 3) {
        onChange([...selected, botValue])
      }
    }
  
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative w-full min-h-[2.5rem] border border-gray-300 rounded-md px-2 py-1 flex items-center gap-2 cursor-pointer">
            {selected.length === 0 && (
              <span className="text-gray-400">Select Bots</span>
            )}
            {selected.map((val) => {
              const opt = options.find((o) => o.value === val.toString())
              if (!opt) return null
              return (
                <div
                  key={opt.value}
                  className="flex items-center bg-gray-200 text-sm px-2 py-1 rounded"
                >
                  <span className="mr-1">{opt.label}</span>
                  <X
                    className="h-4 w-4 cursor-pointer text-gray-600 hover:text-gray-800"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeBot(val)
                    }}
                  />
                </div>
              )
            })}
          </div>
        </PopoverTrigger>
        <PopoverContent align="start"
        className="w-auto min-w-[var(--radix-popover-trigger-width)] max-w-[20rem] max-h-60 overflow-y-auto text-sm">
          {options.map((opt) => {
            const botValue = Number(opt.value)
            const isChecked = selected.includes(botValue)
            return (
              <div
                key={opt.value}
                className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => toggleSelection(botValue)}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => {}}
                  className=""
                />
                <span>{opt.label}</span>
              </div>
            )
          })}
        </PopoverContent>
      </Popover>
    )
  }