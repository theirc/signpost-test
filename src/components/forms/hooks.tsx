import { FormProvider, SubmitHandler, UseFormProps, useForm as useReactHookForm } from "react-hook-form"
import { Button, ButtonProps } from "../ui/button"
import { useModal } from "./modal"
import { DeleteButton, SubmitButton } from "./submitbutton"
import { useEffect, useRef } from "react"

export type FormContext = (props: { children: any }) => any
export type FormHookInstance = ReturnType<typeof useForm>["form"]

interface Options extends UseFormProps {
  doNotReset?: boolean
}

export function useForm<T>(model: Model<T>, options?: Options) {

  options = options || {}
  if (!options.defaultValues) options.defaultValues = {}

  const methods = useReactHookForm<T>(options as any)
  const onSubmit: SubmitHandler<T> = async (data) => { }
  const modal = useModal()
  const editingRef = useRef(false)

  const internalOnSubmit: SubmitHandler<T> = async (data) => {
    console.log("Submit: ", data)
    await form?.onSubmit(data)
    modal.hide()
    if (!options.doNotReset) methods.reset()
  }

  const form = {
    onSubmit,
    submit: async () => {
      await methods.handleSubmit(internalOnSubmit)()
      form.editing = false
    },
    methods,
    get editing() {
      return editingRef.current
    },
    set editing(value: boolean) {
      editingRef.current = value
    },
    edit(data: T) {
      form.editing = true
      form.reset(data)
      if (modal) modal.show()
    },
    modal,
    reset(data?: T) {
      console.log("useForm.reset()", data)
      methods.reset(data)
      const defaults = model.defaultValue || {}
      data ||= { ...defaults } as any
      //Added because reset does not works correctly in modal forms
      const v = methods.getValues()
      if (v) {
        for (let key in v) {
          methods.setValue(key as any, null)
        }
      }
      for (let key in data) {
        const v = data[key]
        if (typeof v === "function" || typeof v === "object" || typeof v == "symbol") continue
        methods.setValue(key as any, data[key] as any)
      }
    },
    context: ((props: { children: any }) => {
      return <FormProvider {...methods}>
        {props.children}
      </FormProvider>
    }) as FormContext,
  }

  return {
    ...methods,
    m: model.fields,
    form,
  }

}

