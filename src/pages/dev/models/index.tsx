import { DataTable } from "@/components/datatable/datatable"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { Page, PageTitle } from "@/components/page"
import { usePage } from "@/components/page/hooks"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/data"
import { Box, Plus, Trash2 } from "lucide-react"

export const models = {
  title: "Models",
  description: "Manage your organization's AI Models.",
  route: "/settings/modelsd",
  url: "/settings/modelsd",
  icon: Box,
  component,
  group: "settings",
  resource: "models",
  action: "read",
} satisfies PageConfig

const columns: Columns<Table<"models">> = {
  title: { header: "Title", size: 600 },
  model: { header: "Model", size: 340 },
  provider: { header: "Provider", size: 120 },
  created_at: { header: "Created", cell: DataTable.cellRender.date, size: 166 },
}

function component() {

  const { navigate } = usePage()

  const menu = [
    {
      title: "Delete", action: async (v) => {
        await supabase.from("models").delete().eq("id", v.id)
      },
      icon: <Trash2 />,
      ask: "Are you sure you want to delete this model?",
    },
  ] satisfies DropdownMenuContents


  return <Page>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <div className="flex">
        <PageTitle />
        <div className="grow"></div>
        <div>
          <Button className="rounded-lg" onClick={() => navigate('/settings/modelsd/new')}><Plus className="h-4 w-4" />New Model</Button>
        </div>
      </div>
      <DataTableSupabase
        table="models"
        columns={columns}
        onRowClick={"/settings/modelsd"}
        sort={["created_at", "desc"]}
        actions={menu}
      />
    </div>
  </Page>

}

