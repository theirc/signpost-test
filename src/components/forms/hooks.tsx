import { FormProvider, SubmitHandler, UseFormProps, useForm as useReactHookForm } from "react-hook-form"
import { Button, ButtonProps } from "../ui/button"
import { useModal } from "./modal"
import { SubmitButton } from "./submitbutton"

export type FormContext = (props: { children: any }) => any
export type FormHookInstance = ReturnType<typeof useForm>["form"]

interface Options extends UseFormProps {
  doNotReset?: boolean
}

export function useForm<T>(model: Model<T>, options: Options = {}) {

  const methods = useReactHookForm<T>(options as any)
  const onSubmit: SubmitHandler<T> = async (data) => { }
  const modal = useModal()

  const internalOnSubmit: SubmitHandler<T> = async (data) => {
    console.log("Submit: ", data)
    await form?.onSubmit(data)
    modal.hide()
    if (!options?.doNotReset) methods.reset()
  }

  const form = {
    onSubmit,
    submit: async () => await methods.handleSubmit(internalOnSubmit)(),
    methods,
    modal,
    context: ((props: { children: any }) => {
      return <FormProvider {...methods}>
        {props.children}
      </FormProvider>
    }) as FormContext,
    SubmitButton: (props: ButtonProps) => <SubmitButton submit={form.submit} {...props} />
  }

  //Demo Watch:
  // useEffect(() => {
  //   const subscription = watch((value, { name, type }) => {
  //     console.log(value, name, type)
  //   })
  //   return () => subscription.unsubscribe()
  // }, [watch])


  return {
    ...methods,
    m: model.fields,
    form,
  }

}

