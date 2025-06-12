import { cn } from "@/lib/utils"
import { Textarea, TextareaProps } from "../ui/textarea"
import { Controller, useFormContext } from "react-hook-form"
import { Col } from "./grid"
import { Control, validateValue } from "./control"

interface Props extends TextareaProps {
  field: Field
  span?: ColumnSpans
  controlClassName?: string
}

export function InputTextArea(props: Props & DefaultInputProps) {

  const { className, field, span, required, validate, hideLabel, controlClassName, ...rest } = props
  const { register } = useFormContext()
  const validateFn = v => validateValue(v, required, field, validate)

  return <Control {...props} className={controlClassName} >
    <Textarea className={cn("focus-visible:ring-transparent h-full nodrag", className)} {...register(field.name, { validate: validateFn })}  {...rest} />
  </Control >

}
