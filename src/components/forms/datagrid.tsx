import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { supabase } from "@/lib/data"
import { useForceUpdate } from "@/lib/utils"
import { Cell, ColumnDef, Header, createColumnHelper, flexRender, getCoreRowModel, useReactTable, } from '@tanstack/react-table'
import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"



const invoices = [
  {
    id: "INV001",
    title: "Paid",
  },
  {
    id: "INV001",
    title: "Paid",
  },
  {
    id: "INV001",
    title: "Paid",
  },
  {
    id: "INV001",
    title: "Paid",
  },
  {
    id: "INV001",
    title: "Paid",
  },

]

const fallbackData = []
const columnHelper = createColumnHelper<AgentConfig>()
const columns = [
  columnHelper.accessor('id', {
    header: (a) => <span className="font-semibold text-black">ID</span>,
  }),
  columnHelper.accessor("title", {
    header: (a) => <span className="font-semibold text-black">Title</span>,
  }),
]

interface Props<T> {
  model: Model<T> | SupabaseModel
  onLoad?: () => Promise<any[]>
  editPath?: string
}

function LinkWrapper(props: { to: string, children: any }) {
  if (!props.to) return props.children
  return <Link to={props.to}>{props.children}</Link>
}


export function Datagrid<T = object>(props: Props<T>) {

  let { model, onLoad } = props

  const update = useForceUpdate()
  const navigate = useNavigate()
  const [data, setData] = useState([] as T[])

  const tableState = useRef({
    initialized: false,
    columns: [] as ColumnDef<T>[],
  })

  useEffect(() => {
    onLoad().then((data) => {
      if (!Array.isArray(data)) data = [data]
      setData(data || [])
    })
  }, [])

  if (!onLoad) {
    if (model.data) {
      const sbm: SupabaseQueryBuilder = model.data as any
      onLoad = async () => {
        const { data, count } = await sbm.select()
        return data as any[]
      }
    } else {
      onLoad = async () => []
    }
  }

  if (!tableState.current.initialized) {
    tableState.current.initialized = true
    Object.values(model.fields).forEach((field: Field) => {
      if (!field || field.hidden) return
      const column = columnHelper.accessor(field.name, {
        header: (a) => <span className="font-semibold text-black">{field.title}</span>,
      })
      tableState.current.columns.push(column as any)
    })
  }

  const table = useReactTable({
    columns: tableState.current.columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  //---------------------------------------------

  const onRowClick = (e: any) => {
    if (!props.editPath) return
    navigate(`/${props.editPath}/${e}`)
  }

  return <div className="border-solid border-slate-400  size-full">
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <TableHead key={header.id} className="h-8 pl-4 pr-0">
                <div className="flex">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  <div className="flex-grow" />
                  <div className="border-r" />
                </div>
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map(row => (
          <TableRow className="cursor-pointer" onClick={() => onRowClick(row.getValue("id"))} key={row.id}>
            {row.getVisibleCells().map(cell => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>

}

