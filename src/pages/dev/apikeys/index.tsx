import { DataTable } from "@/components/datatable/datatable"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { Page, PageTitle } from "@/components/page"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/data"
import { Key, Plus, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Database } from "@/lib/agents/supabase"


export const apikeys = {
  title: "API Keys",
  description: "Manage your organization's API Keys.",
  route: "/settings/apikeysd",
  url: "/settings/apikeysd",
  icon: Key,
  component,
  group: "settings",
  resource: "apikeys",
  action: "read",
} satisfies PageConfig

const columns: Columns<Table<"api_keys">> = {
  type: { header: "Type", size: 150 },
  description: { header: "Description", size: 420 },
  team_id: { header: "Team", size: 200, cell: ({ row }) => row.original.team_id?.["name"] },
  key: {
    header: "Key", size: 300, cell: ({ row }) => {
      const value = row.original.key
      return value ? "••••••••" + value.slice(-4) : "Not set"
    }
  },
  created_at: { header: "Created", cell: DataTable.cellRender.date, size: 166 },
}

function component() {

  const navigate = useNavigate()

  const menu = [
    {
      title: "Delete", action: async (v) => {
        await supabase.from("api_keys").delete().eq("id", v.id)
      },
      icon: <Trash2 />,
      ask: "Are you sure you want to delete this API key?",
    },
  ] satisfies DropdownMenuContents


  return <Page>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <div className="flex">
        <PageTitle />
        <div className="grow"></div>
        <div>
          <Button className="rounded-lg" onClick={() => navigate('/settings/apikeysd/new')}><Plus className="h-4 w-4" />New API Key</Button>
        </div>
      </div>
      <DataTableSupabase
        table="api_keys"
        columns={columns}
        onRowClick={"/settings/apikeysd"}
        sort={["created_at", "desc"]}
        actions={menu}
        select={`
        *,
        team_id (
          name
        )
      `}
      />
    </div>
  </Page>

}
