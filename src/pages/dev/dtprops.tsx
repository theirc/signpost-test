import { Page, PageTitle } from "@/components/page"
import { Checkbox } from "@/components/ui/checkbox"
import { Table } from "lucide-react"
import { useEffect, useState } from "react"
import { DataTable } from "../../components/ui/datatable/datatable"
import { columns, onLoad } from "./demodata"
import { Label } from "@/components/ui/label"
import { EmptyData } from "@/components/ui/datatable/empty"

export const dev_dtprops = {
  title: "DataTable Props",
  description: "Demo DataTable Props.",
  path: "/dev_dtprops",
  url: "/dev_dtprops",
  icon: Table,
  component,
  resource: "agents",
  action: "read",
  group: "dev",
} satisfies PageConfig

const emptyData = []

function component() {

  const [data, setData] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(true)
  const [showColumnSelection, setShowColumnSelection] = useState(true)
  const [showPagination, setShowPagination] = useState(true)
  const [hideSelection, setHideSelection] = useState(false)
  const [hideActions, setHideActions] = useState(false)
  const [showEmptyState, setShowEmptyState] = useState(false)
  const [showCustomEmpty, setShowCustomEmpty] = useState(false)

  useEffect(() => {
    onLoad().then((data) => setData(data))
  }, [])

  return <Page config={dev_dtprops}>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <div className="flex">
        <PageTitle />
        <div className="grow"></div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Checkbox checked={showSearch} onCheckedChange={(w) => setShowSearch(w == true)} />
              <Label>Show Pagination</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={showColumnSelection} onCheckedChange={(w) => setShowColumnSelection(w == true)} />
              <Label>Show Column Selection</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={showPagination} onCheckedChange={(w) => setShowPagination(w == true)} />
              <Label>Show Pagination</Label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Checkbox checked={hideSelection} onCheckedChange={(w) => setHideSelection(w == true)} />
              <Label>Hide Selection</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={hideActions} onCheckedChange={(w) => setHideActions(w == true)} />
              <Label>Hide Actions</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={showCustomEmpty} onCheckedChange={(w) => setShowCustomEmpty(w == true)} />
              <Label>Use Custom Empty</Label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Checkbox checked={showEmptyState} onCheckedChange={(w) => setShowEmptyState(w == true)} />
              <Label>Show Empty State</Label>
            </div>
          </div>


        </div>
      </div>
      <DataTable
        columns={columns}
        showSearch={showSearch}
        showColumnSelection={showColumnSelection}
        showPagination={showPagination}
        hideSelection={hideSelection}
        hideActions={hideActions}
        data={showEmptyState ? emptyData : data}
      >
        {showCustomEmpty && <EmptyData>
          Nothing to see! 👀
        </EmptyData>}
      </DataTable>
    </div>
  </Page>

}