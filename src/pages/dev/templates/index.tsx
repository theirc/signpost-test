import { Page, PageTitle } from "@/components/page"
import { Book, BrainIcon, Plus, Sparkles } from "lucide-react"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { DataTable } from "@/components/datatable/datatable"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { DeclarativeMenu } from "@/components/declarativemenu"

export const templates = {
  title: "Templates 🧪",
  description: "Manage your organization's templates.",
  route: "/templatesd",
  url: "/templatesd",
  icon: Book,
  component,
  resource: "templates",
  action: "read",
} satisfies PageConfig

const columns: Columns<Table<"agents">> = {
  id: { header: "ID", cell: DataTable.cellRender.number, size: 64 },
  title: { header: "Title", size: 620 },
  description: { header: "Description", size: 450 },
  created_at: { header: "Created", cell: DataTable.cellRender.date, size: 166 },
}

function component() {

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
        filter={q => q.is("team_id", null)}
      />
    </div>
  </Page>

}

