import { Page, PageTitle } from "@/components/page"
import { BrainIcon, Plus, Sparkles } from "lucide-react"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { DataTable } from "@/components/datatable/datatable"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { DeclarativeMenu } from "@/components/declarativemenu"

export const agents = {
  title: "Agents 🧪",
  description: "Manage your agents and their configurations.",
  route: "/agents",
  url: "/agents",
  icon: BrainIcon,
  component,
  resource: "agents",
  action: "read",
} satisfies PageConfig

const columns: Columns<Table<"agents">> = {
  id: { header: "ID", cell: DataTable.cellRender.number, size: 64 },
  title: { header: "Title", size: 550 },
  team_id: { header: "Team", size: 200, cell: ({ row }) => row.original.team_id?.["name"] },
  description: { header: "Description", size: 300 },
  created_at: { header: "Created", cell: DataTable.cellRender.date, size: 166 },
}

function component() {

  const { selectedTeam } = useTeamStore()
  const navigate = useNavigate()

  const menu = [
    { title: "New Agent", action: () => navigate('/agent/new'), icon: <Plus /> },
    { title: "From Template", action: () => console.log("From Template") },
    { title: "Auto-Generate", action: () => console.log("Auto-Generate"), icon: <Sparkles /> },
  ] satisfies DropdownMenuContents


  return <Page>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <div className="flex">
        <PageTitle />
        <div className="grow"></div>
        <div>
          <DeclarativeMenu menu={menu}>
            <Button className="rounded-lg"><Plus className="h-4 w-4" />Create Agent</Button>
          </DeclarativeMenu>
        </div>
      </div>
      <DataTableSupabase
        table="agents"
        columns={columns}
        onRowClick={"/agent"}
        sort={["created_at", "desc"]}
        filter={q => q.eq("team_id", selectedTeam?.id)}
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

