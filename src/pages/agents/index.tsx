import { Page, PageTitle } from "@/components/page"
import { BrainIcon } from "lucide-react"
import { DataTable } from "../../components/ui/datatable/datatable"
import { columns, onLoad } from "../dev/demodata"

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

function component() {

  return <Page config={agents}>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <div className="flex">
        <PageTitle />
        <div>
          {/* ToDo */}
        </div>
      </div>
      <DataTable
        onLoad={onLoad}
        columns={columns}
        sort={["name", "asc"]}
      />
    </div>
  </Page>

}

