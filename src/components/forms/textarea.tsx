import { cn } from "@/lib/utils"
import { Textarea, TextareaProps } from "../ui/textarea"
import { Controller, useFormContext } from "react-hook-form"
import { Col } from "./grid"
import { Control, validateValue } from "./control"

interface Props extends TextareaProps {
  field: Field
  span?: ColumnSpans
}

export function InputTextArea({ className, field, span, required, validate, ...props }: Props & DefaultInputProps) {

  const { register } = useFormContext()
  const validateFn = v => validateValue(v, required, field, validate)

  return <Control field={field} span={span} required={required}>
    <Textarea className={cn("focus-visible:ring-transparent w-full h-full", className)} {...register(field.name, { validate: validateFn })}  {...props} />
  </Control>

}
