import { cn } from "@/lib/utils"
import { useFormContext } from "react-hook-form"
import { Input as ShadInput } from "../ui/input"
import { Control, validateValue } from "./control"

export function Input({ field, span, className, required, validate, ...props }: React.ComponentProps<"input"> & DefaultInputProps) {

  const { register } = useFormContext()
  const validateFn = v => validateValue(v, required, field, validate)

  return <Control {...props} field={field} span={span} required={required} >
    <ShadInput className={cn("focus-visible:ring-transparent w-full h-full", className)} {...register(field.name, { validate: validateFn })}  {...props} />
  </Control>

}