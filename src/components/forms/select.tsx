import { cn } from "@/lib/utils"
import { Controller, useFormContext } from "react-hook-form"
import { SelectContent, SelectItem, SelectTrigger, SelectValue, Select as ShadcnSelect } from "../ui/select"
import { Control, validateValue } from "./control"

export function Select({ field, span, className, required, validate, ...props }: React.ComponentProps<"input"> & DefaultInputProps) {

  const { control } = useFormContext()
  const { name } = field

  let childs = props.children
  if (field.list) childs = (field.list || []).map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)

  const validateFn = v => validateValue(v, required, field, validate)

  return <Control field={field} span={span} required={required}>
    <Controller
      name={name}
      control={control}
      rules={{ validate: validateFn }}
      render={({ field: { name, value, onChange } }) => {
        return <ShadcnSelect name={name} onValueChange={onChange} defaultValue={value}>
          <SelectTrigger className={cn("focus-visible:ring-transparent ring-0 focus:ring-0")}>
            <SelectValue className={cn("focus-visible:ring-transparent w-full h-full", className)}  {...props} />
          </SelectTrigger>
          <SelectContent>
            {childs}
          </SelectContent>
        </ShadcnSelect>
      }}
    />
  </Control>

}






