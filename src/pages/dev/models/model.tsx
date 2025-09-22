import { Page, PageTitle } from "@/components/page"
import { CRUDLoader } from "@/components/page/crudloader"
import { CRUDToolbar } from "@/components/page/crudtoolbar"
import { useDatabaseItem } from "@/components/page/hooks"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { Box } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

export const models_crud = {
  title: "Model",
  route: "/settings/modelsd/:id",
  component,
  group: "settings",
  resource: "models",
  icon: Box,
  action: "read",
} satisfies PageConfig

const FormSchema = z.object({
  title: z.string(),
  model: z.string(),
  provider: z.string(),
})

type FormData = z.infer<typeof FormSchema>

export function component() {

  const { data, loading, submit, toastSuccess, navigate } = useDatabaseItem("models")

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: data,
    values: data,
  })

  async function onSubmit(data: FormData) {
    console.log("Submit: ", data)
    await submit(data)
    toastSuccess()
    navigate("/settings/modelsd")
  }

  if (loading) return <CRUDLoader />

  return <Page>
    <div className="pb-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <PageTitle>
            <CRUDToolbar table="models" onSuccess={"/settings/modelsd"} />
          </PageTitle>
          <div className="rgrid">
            <div className="row">
              <div className="rc-4">
                <FormField control={form.control} name="provider" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="rc-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="rc-4">
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  </Page>

}
