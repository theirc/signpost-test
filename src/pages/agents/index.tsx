import { Page, PageTitle } from "@/components/page"
import { BrainIcon, Plus, Sparkles } from "lucide-react"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { DataTable } from "@/components/datatable/datatable"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { DeclarativeMenu } from "@/components/declarativemenu"

export const agents = {
  title: "Agents",
  description: "Manage your agents and their configurations.",
  path: "/agents",
  url: "/agents",
  icon: BrainIcon,
  component,
  resource: "agents",
  action: "read",
} satisfies PageConfig

const columns: Columns<Table<"agents">> = {
  id: { header: "ID", cell: DataTable.cellRender.number, size: 64 },
  title: { header: "Title", size: 620 },
  created_at: { header: "Created", cell: DataTable.cellRender.date, size: 166 },
  description: { header: "Description", size: 380 },
}

function component() {

  const { selectedTeam } = useTeamStore()
  const navigate = useNavigate()

  const menu = [
    { title: "New Agent", action: () => navigate('/agent/new'), icon: <Plus /> },
    { title: "From Template", action: () => console.log("From Template") },
    { title: "Auto-Generate", action: () => console.log("Auto-Generate"), icon: <Sparkles /> },
  ] satisfies DropdownMenuContents


  return <Page config={agents}>
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
        hideSelection
        hideActions
        columns={columns}
        onRowClick={"/agent"}
        sort={["created_at", "desc"]}
        filter={q => q.eq("team_id", selectedTeam?.id)}
      />
    </div>
  </Page>

}

