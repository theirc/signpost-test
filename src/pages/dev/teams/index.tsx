import { DataTable } from "@/components/datatable/datatable"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { Page, PageTitle } from "@/components/page"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/data"
import { Users, Plus, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

export const teams = {
  title: "Teams",
  description: "Manage your organization's teams.",
  route: "/settings/teamsd",
  url: "/settings/teamsd",
  icon: Users,
  component,
  group: "settings",
  resource: "teams",
  action: "read",
} satisfies PageConfig

const columns: Columns<Table<"teams">> = {
  name: { header: "Name", size: 300 },
  description: { header: "Description", size: 650 },
  status: { header: "Status", size: 120 },
  created_at: { header: "Created", cell: DataTable.cellRender.date, size: 166 },
}

function component() {

  const navigate = useNavigate()

  const menu = [
    {
      title: "Delete", action: async (v) => {
        await supabase.from("teams").delete().eq("id", v.id)
      },
      icon: <Trash2 />,
      ask: "Are you sure you want to delete this team?",
    },
  ] satisfies DropdownMenuContents


  return <Page>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <div className="flex">
        <PageTitle />
        <div className="grow"></div>
        <div>
          <Button className="rounded-lg" onClick={() => navigate('/settings/teamsd/new')}><Plus className="h-4 w-4" />New Team</Button>
        </div>
      </div>
      <DataTableSupabase
        table="teams"
        columns={columns}
        hideSelection
        onRowClick={"/settings/teamsd"}
        sort={["created_at", "desc"]}
        actions={menu}
      />
    </div>
  </Page>

}
