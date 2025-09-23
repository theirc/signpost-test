import { DataTable } from "@/components/datatable/datatable"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { Page, PageTitle } from "@/components/page"
import { usePage } from "@/components/page/hooks"
import { Table } from "lucide-react"

// 💡 Please check `src\pages\dev\demo\dtprops.tsx` for extra documentation.

export const supademo = {
  title: "DataTableSupabase",
  description: "Demo DataTable Supabase.",
  route: "/devsupa",
  url: "/devsupa",
  icon: Table,
  component,
  resource: "agents",
  action: "read",
  group: "dev",
} satisfies PageConfig


/* 💡 Column Declaration
   Defines the column configuration for a DataTable or Supabase DataTable.

   Compatibility:
   - Fully compatible with TanStack Table’s column definitions.
   - Simplifies setup by reducing repetition of common properties
     like `accessorKey`, `id`, etc.

   Behavior:
   - The column key is inferred automatically from the field name
     in the object declaration, but can be overridden if needed.
   - A type helper is used to infer the column type based on the
     field type. In this example, we use `Table<"agents">` from
     the Supabase schema.

   Features:
   - Provides predefined cell renderers for common types such as
     numbers, dates, JSON, etc.
   - These renderers are available at `DataTable.cellRender`.
*/
const columns: Columns<Table<"agents">> = {
  id: { header: "ID", cell: DataTable.cellRender.number, size: 64 },
  title: { header: "Title", size: 450 },
  description: { header: "Description", size: 400 },
  team_id: { header: "Team", size: 200, cell: ({ row }) => row.original.team_id["name"] },
  created_at: { header: "Created", cell: DataTable.cellRender.date, size: 166 },
}

function component() {

  const { team } = usePage()

  return <Page>
    <PageTitle />
    {/* 👇 Main component inherited from DataTable.
    It supports the same props as DataTable, but also adds
    Supabase-specific props to handle queries, filters, ordering,
    realtime updates, and field selection automatically.
*/}
    <DataTableSupabase

      // 👇 Required prop to indicate which table or view is being queried.  
      //     Also enables type inference and autocompletion based on the table schema.
      table="agents"

      // 👇 Sorting configuration. Works the same as in DataTable,  
      //     but also applies ordering directly in the Supabase query.
      sort={["created_at", "desc"]}

      // 👇 Filter applied to the Supabase query.  
      //     Equivalent to: supabase.from("table").select().[filter]
      filter={q => q.eq("team_id", team?.id)}

      // 👇 Throttle interval (in ms) used when realtime is enabled.  
      //     Defaults to 2000 ms if not provided.
      realtTimeThrottle={2000}

      // 👇 Displays a toolbar toggle to enable/disable realtime updates.  
      //     When active, the table listens to database changes and updates automatically.
      realtime

      // 👇 Fields to be selected in the Supabase query.  
      //     Equivalent to: supabase.from("table").select([fields])
      select={`
    *,
    team_id (
      name
    )
  `}


      columns={columns}
      onRowClick={"/agent"}
    />

  </Page>

}

