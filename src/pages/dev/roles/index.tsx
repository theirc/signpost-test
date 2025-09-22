import { DataTable } from "@/components/datatable/datatable"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { Page, PageTitle } from "@/components/page"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/data"
import { Database } from "@/lib/agents/supabase"
import { Shield, Plus, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"


export const roles = {
  title: "Roles",
  description: "Manage your organization's user roles and permissions.",
  route: "/settings/rolesd",
  url: "/settings/rolesd",
  icon: Shield,
  component,
  group: "settings",
  resource: "roles",
  action: "read",
} satisfies PageConfig

const columns: Columns<Table<"roles">> = {
  name: { header: "Name", size: 300 },
  description: { header: "Description", size: 400 },
  team_id: { header: "Team", size: 400 },
  created_at: { header: "Created", cell: DataTable.cellRender.date, size: 166 },
}

function component() {

  const navigate = useNavigate()

  const menu = [
    {
      title: "Delete", action: async (v) => {
        await supabase.from("roles").delete().eq("id", v.id)
      },
      icon: <Trash2 />,
      ask: "Are you sure you want to delete this role?",
    },
  ] satisfies DropdownMenuContents


  return <Page>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <div className="flex">
        <PageTitle />
        <div className="grow"></div>
        <div>
          <Button className="rounded-lg" onClick={() => navigate('/settings/rolesd/new')}><Plus className="h-4 w-4" />New Role</Button>
        </div>
      </div>
      <DataTableSupabase
        table="roles"
        columns={columns}
        hideSelection
        onRowClick={"/settings/rolesd"}
        sort={["created_at", "desc"]}
        actions={menu}
      />
    </div>
  </Page>

}
