import { Page, PageTitle } from "@/components/page"
import { Box, BrainIcon, Plus, Sparkles } from "lucide-react"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { DataTable } from "@/components/datatable/datatable"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { DeclarativeMenu } from "@/components/declarativemenu"

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
          <Button className="rounded-lg" onClick={() => navigate('/settings/modelsd/new')}><Plus className="h-4 w-4" />New Model</Button>
        </div>
      </div>
      <DataTableSupabase
        table="models"
        columns={columns}
        hideSelection
        onRowClick={"/settings/modelsd"}
        sort={["created_at", "desc"]}
      />
    </div>
  </Page>

}

