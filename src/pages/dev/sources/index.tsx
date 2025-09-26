import { DataTable } from "@/components/datatable/datatable"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { Page, PageTitle } from "@/components/page"
import { Button } from "@/components/ui/button"
import { Book, Box, Plus, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { usePage } from "@/components/page/hooks"
import { calculateVectorPercentage } from "@/pages/knowledge/utils"

export const sources = {
  title: "Sources",
  description: "Manage your data sources and their content.",
  route: "/settings/sourcesd",
  url: "/settings/sourcesd",
  icon: Book,
  component,
  group: "knowledge",
  resource: "sources",
  action: "read",
} satisfies PageConfig

const columns: Columns<Table<"sources">> = {
  name: { header: "Name", size: 400 },
  tags: {
    header: "Tags",
    size: 200,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.tags.map((tag: string) => {
          let tagStyle = "bg-muted"
          if (tag === 'File Upload') {
            tagStyle = "bg-blue-100 text-blue-800"
          } else if (tag === 'Live Data') {
            tagStyle = "bg-purple-100 text-purple-800"
          }
          return (
            <span
              key={tag}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${tagStyle}`}
            >
              {tag}
            </span>
          )
        })}
      </div>
    ),
  },
  type: { header: "Type", size: 100 },
  vector: {
    header: "Vector",
    size: 100,
    cell: ({ row }) => (
      row.original.vector ? (
        <span className="text-green-600 font-semibold">Yes</span>
      ) : (
        <span className="text-gray-400">No</span>
      )
    ),
  },
  team_id: {
    header: "Team", size: 200,
    cell: ({ row }) => row.original.team_id["name"],
  },
  created_at: { header: "Created", cell: DataTable.cellRender.date, size: 166 },
  last_updated: { header: "Updated", cell: DataTable.cellRender.date, size: 166 },
}


function component() {

  const { team, navigate } = usePage()

  return <Page>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <div className="flex">
        <PageTitle />
        <div className="grow"></div>
        <div>
          <Button className="rounded-lg" onClick={() => navigate('/settings/sourcesd/new')}><Plus className="h-4 w-4" />New Source</Button>
        </div>
      </div>
      <DataTableSupabase
        table="sources"
        columns={columns}
        onRowClick={"/settings/sourcesd"}
        sort={["created_at", "desc"]}
        filter={q => q.eq("team_id", team?.id)}
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

