import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from '@radix-ui/react-checkbox'
import { X, ChevronsUpDown } from "lucide-react"

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
  
    const selectedOptions = selected.map(val => options.find(o => o.value === val.toString())).filter(Boolean) as Option[];
  
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative w-auto text-sm font-medium text-foreground hover:text-accent-foreground flex items-center gap-1 cursor-pointer">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">Select Bots</span>
            ) : (
              <div className="flex items-center gap-1 flex-wrap">
                {selectedOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center">
                    <span>{opt.label}</span>
                  </div>
                ))}
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 ml-1 text-muted-foreground" />
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
                  className="mr-2"
                />
                <span>{opt.label}</span>
              </div>
            )
          })}
        </PopoverContent>
      </Popover>
    )
  }