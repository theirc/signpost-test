import { DataTable } from "@/components/datatable/datatable"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { Page, PageTitle } from "@/components/page"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/data"
import { Users, Plus, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

export const users = {
  title: "Users",
  description: "Manage your organization's users.",
  route: "/settings/usersd",
  url: "/settings/usersd",
  icon: Users,
  component,
  group: "settings",
  resource: "users",
  action: "read",
} satisfies PageConfig

const columns: Columns<Table<"users">> = {
  first_name: { header: "First Name", size: 200 },
  last_name: { header: "Last Name", size: 200 },
  email: { header: "Email", size: 220 },
  status: { header: "Status", size: 120 },
  role: { header: "Role", size: 120, cell: ({ row }) => row.original.role?.["name"] },
  team: { header: "Team", size: 200, cell: ({ row }) => row.original.team?.["name"] },
  created_at: { header: "Created", cell: DataTable.cellRender.date, size: 166 },
}

function component() {

  const navigate = useNavigate()

  const menu = [
    {
      title: "Delete", action: async (v) => {
        await supabase.from("users").delete().eq("id", v.id)
      },
      icon: <Trash2 />,
      ask: "Are you sure you want to delete this user?",
    },
  ] satisfies DropdownMenuContents


  return <Page>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <div className="flex">
        <PageTitle />
        <div className="grow"></div>
        <div>
          <Button className="rounded-lg" onClick={() => navigate('/settings/usersd/new')}><Plus className="h-4 w-4" />New User</Button>
        </div>
      </div>
      <DataTableSupabase
        table="users"
        columns={columns}
        onRowClick={"/settings/usersd"}
        sort={["created_at", "desc"]}
        actions={menu}
        select={`
        *,
        role (
          name
        ),
        team (
          name
        )
      `}

      />
    </div>
  </Page>

}
