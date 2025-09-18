import { Page, PageTitle } from "@/components/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDatabaseItem, usePage } from "@/components/page/hooks"
import { CRUDLoader } from "@/components/page/crudloader"
import { Box } from "lucide-react"

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

  const { data, loading, id } = useDatabaseItem("models")

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: data || {},
    values: data || {},
  })

  console.log("Data: ", data, loading, id)


  const onSubmit = async (data: FormData) => {
    console.log("Submit: ", data)
  }

  if (loading) return <CRUDLoader />

  return <Page>
    <div className="pb-8">
      <PageTitle />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="rgrid">
            <div className="row">
              <div className="rc-4">
                <FormField control={form.control} name="provider" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select {...field}>
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
          <div className="flex justify-end">
            <Button type="submit" className="mt-4" disabled={form.formState.isSubmitting}>Save</Button>
          </div>
        </form>
      </Form>
    </div>
  </Page>
}
