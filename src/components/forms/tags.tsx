import { Controller, useFormContext } from "react-hook-form"
import { Control, validateValue } from "./control"
import { Tag, TagInput, TagInputProps } from "emblor"
import { useState } from "react"

export function Tags({ field, span, className, required, validate, hideLabel, ...props }: Partial<TagInputProps> & DefaultInputProps) {

  const { control } = useFormContext()
  const validateFn = v => validateValue(v, required, field, validate)
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)

  return <Control {...props} field={field} span={span} required={required} hideLabel={hideLabel} >
    <Controller
      name={field.name}
      control={control}
      rules={{ validate: validateFn }}
      render={({ field: { name, value, onChange } }) => {
        value = value || []
        value = value.map((v: any, i) => ({ id: i, text: v }))
        return <TagInput tags={value}
          setTags={(newTags: Tag[]) => {
            console.log("Tags: ", newTags)
            onChange(newTags.map((t: Tag) => t.text))
          }}
          placeholder="Add an item"
          activeTagIndex={activeTagIndex}
          setActiveTagIndex={setActiveTagIndex}
          inlineTags={false}
          styleClasses={{ input: 'w-full', }}
          inputFieldPosition={"top"}
        />
      }}
    />
  </Control>

}