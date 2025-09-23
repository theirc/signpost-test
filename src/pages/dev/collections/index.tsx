import { DataTable } from "@/components/datatable/datatable"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { Page, PageTitle } from "@/components/page"
import { Button } from "@/components/ui/button"
import { Book, Box, Plus, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { usePage } from "@/components/page/hooks"
import { calculateVectorPercentage } from "@/pages/knowledge/utils"

export const collections = {
  title: "Collections",
  description: "Manage your organization's AI Collections.",
  route: "/settings/collectionsd",
  url: "/settings/collectionsd",
  icon: Book,
  component,
  group: "knowledge",
  resource: "collections",
  action: "read",
} satisfies PageConfig

const columns: Columns<View<"collections_with_counts">> = {
  name: { header: "Name", size: 400 },
  sourceCount: { header: "Sources", size: 120, cell: DataTable.cellRender.number },
  vectorizedCount: {
    header: "Vector Status",
    size: 400,
    accessorFn: row => row.sourceCount > 0 ? row.vectorizedCount / row.sourceCount : 0,
    cell: ({ row }) => {
      const vectorizedCount = typeof row.original.vectorizedCount === 'number' && !isNaN(row.original.vectorizedCount) ? row.original.vectorizedCount : 0
      const sourceCount = typeof row.original.sourceCount === 'number' && !isNaN(row.original.sourceCount) ? row.original.sourceCount : 0
      const vectorPercentage = calculateVectorPercentage(vectorizedCount, sourceCount)
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>
              {vectorizedCount} / {sourceCount} sources
            </span>
            <span>{vectorPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${vectorPercentage}%` }}
            ></div>
          </div>
        </div>
      )
    },
    sortingFn: (a, b) => {
      const aPercent = a.original.sourceCount > 0 ? (a.original.vectorizedCount / a.original.sourceCount) : 0
      const bPercent = b.original.sourceCount > 0 ? (b.original.vectorizedCount / b.original.sourceCount) : 0
      return aPercent - bPercent
    },
  },
  team_id: {
    header: "Team", size: 200,
    cell: ({ row }) => row.original.team_id["name"],
  },
  created_at: { header: "Created", cell: DataTable.cellRender.date, size: 166 },
}


function component() {

  const navigate = useNavigate()
  const { team } = usePage()

  return <Page>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <div className="flex">
        <PageTitle />
        <div className="grow"></div>
        <div>
          <Button className="rounded-lg" onClick={() => navigate('/settings/collectionsd/new')}><Plus className="h-4 w-4" />New Collection</Button>
        </div>
      </div>
      <DataTableSupabase
        table="collections_with_counts"
        columns={columns}
        onRowClick={"/settings/collectionsd"}
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

