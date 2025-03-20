import { useFormContext } from "react-hook-form"
import { ZodType } from "zod"
import { Col } from "./grid"

declare global {
  interface DefaultInputProps {
    field: Field
    span?: ColumnSpans
    children?: any
    required?: boolean
    validate?: ZodType
    hideLabel?: boolean
  }
}

export function validateValue(v: any, required: boolean, field: Field, validate?: ZodType) {
  if (v != null && typeof v === "string") v = v.trim()
  console.log("Validating: ", v)

  if (required && !v) return "This field is required"


  const val = validate || field.validate
  if (val) {
    const r = val.safeParse(v)
    if (r.success) return null
    return r.error.issues[0]?.message || null
  }

  return null

}

export function Control({ field, span, required, hideLabel, ...props }: DefaultInputProps) {

  const { formState: { errors } } = useFormContext()
  const { title, name } = field
  const errorObject = errors[name]

  let error = ""

  if (errorObject) {
    console.log("Error Object: ", errorObject)
    error = errorObject.message as string
  }

  return <Col span={span || 4} className="flex flex-col w-full" >
    {!hideLabel && <div className="flex items-center gap-1 pb-1">
      {title && <div className="text-sm ml-[2px]">{title}</div>}
      {required && <div className="text-red-500 text-sm">●</div>}
    </div>}
    <div className="flex-grow">
      {props.children}
    </div>
    {error && <span className="text-sm text-red-500">{error}</span>}
  </Col>



}