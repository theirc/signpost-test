import { DataTable } from "@/components/datatable/datatable"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { Page, PageTitle } from "@/components/page"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/data"
import { Box, Folder, Plus, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

export const projects = {
  title: "Projects",
  description: "Manage your organization's projects and team assignments.",
  route: "/settings/projectsd",
  url: "/settings/projectsd",
  icon: Folder,
  component,
  group: "settings",
  resource: "projects",
  action: "read",
} satisfies PageConfig

const columns: Columns<Table<"projects">> = {
  name: { header: "Name", size: 200 },
  description: { header: "Description", size: 550 },
  status: { header: "Status", size: 100 },
  team: { header: "Team", size: 200, cell: ({ row }) => row.original.team?.["name"] },
  created_at: { header: "Model", size: 200, cell: DataTable.cellRender.date, },
}

function component() {

  const navigate = useNavigate()

  const menu = [
    {
      title: "Delete", action: async (v) => {
        await supabase.from("projects").delete().eq("id", v.id)
      },
      icon: <Trash2 />,
      ask: "Are you sure you want to delete this Project?",
    },
  ] satisfies DropdownMenuContents


  return <Page>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <div className="flex">
        <PageTitle />
        <div className="grow"></div>
        <div>
          <Button className="rounded-lg" onClick={() => navigate('/settings/projectsd/new')}><Plus className="h-4 w-4" />New Project</Button>
        </div>
      </div>
      <DataTableSupabase
        table="projects"
        columns={columns}
        onRowClick={"/settings/projectsd"}
        sort={["created_at", "desc"]}
        actions={menu}
        select={`
        *,
        team (
          name
        )
      `}
      />
    </div>
  </Page>

}

