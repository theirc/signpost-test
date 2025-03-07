import { cn } from "@/lib/utils"
import { Textarea, TextareaProps } from "../ui/textarea"
import { Controller, useFormContext } from "react-hook-form"
import { Col } from "./grid"
import { Control, validateValue } from "./control"

interface Props extends TextareaProps {
  field: Field
  span?: ColumnSpans
}

export function InputTextArea(props: Props & DefaultInputProps) {

  const { className, field, span, required, validate, ...rest } = props
  const { register } = useFormContext()
  const validateFn = v => validateValue(v, required, field, validate)

  return <Control {...props}>
    <Textarea className={cn("focus-visible:ring-transparent h-full", className)} {...register(field.name, { validate: validateFn })}  {...rest} />
  </Control>

}
