import { cn } from "@/lib/utils"
import { useFormContext } from "react-hook-form"
import { Input as ShadInput } from "../ui/input"
import { Control, validateValue } from "./control"
import { Slider as ShadcnSlider } from '@/components/ui/slider'
import { SliderProps } from "@radix-ui/react-slider"

export function Slider({ field, span, className, required, validate, ...props }: SliderProps & DefaultInputProps) {

  const { register } = useFormContext()
  const f = register(field.name)

  return <Control field={field} span={span} required={required}>
    <ShadcnSlider className={cn("w-full mb-2 cursor-pointer", className)} onChange={f.onChange} {...props} />
  </Control>

}