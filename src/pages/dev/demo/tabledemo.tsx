import { Page, PageTitle } from "@/components/page"
import { Checkbox } from "@/components/ui/checkbox"
import { BadgeCheck, Bell, Coins, Table, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { DataTable } from "../../../components/datatable/datatable"
import { columns, onLoad } from "./demodata"
import { Label } from "@/components/ui/label"
import { EmptyData } from "@/components/datatable/empty"
import { ToolbarItem } from "@/components/datatable/toolbaritem"
import { toast } from "sonner"
import { usePage } from "@/components/page/hooks"

/**
 * 💡 Page Declaration
 *
 * Defines a single entry point for managing a page.  
 * Handles common setup automatically, such as:
 *  - Sidebar registration
 *  - Permission controls
 *  - Other shared configuration
 *
 * To register a new page:
 *  1. Export this constant.
 *  2. Import it in `src/lib/pages.tsx`.
 *  3. Add it to the `pages` constant for discovery and use.
 *
 * ✅ Every page in the system should follow this pattern.
 */
export const dev_dtprops = {

  //The title of the page.
  title: "DataTable",

  //The description of the page. 
  description: "Demo DataTable Props.",

  //The route of the page.
  route: "/dev_dtprops",

  //The url of the page used by the sidebar. If you let this empty, the page will not appear in the sidebar. 
  //This is useful if you have a page that is not directly accessible by the user, like CRUD pages.
  url: "/dev_dtprops",

  //The icon of the page.
  icon: Table,

  //The component of the page.
  component,

  //The resource for permissions.
  resource: "agents",

  //The action for permissions.
  action: "read",

  //The group for the sidebar.
  group: "dev",

} satisfies PageConfig //This provides autocompletion for the page declaration and type checking.


const emptyData = []


/*
💡 Page Component

This function represents the actual page implementation.  
It shares the same name as the corresponding property in the page declaration,  
making the association clear and ensuring easy registration.

Each page provides a dedicated React context that exposes all the information  
needed to render it (such as configuration and metadata).  
This context is consumed by multiple components within the page (e.g., PageTitle)  
to automate access to common properties and avoid repetitive prop drilling.

Additionally, the context bundles commonly used hooks (user, teams, etc.)  
and integrates the <Toaster /> component to simplify handling notifications.

⚠️ Note: This function should not be exported. 
It is only meant for use inside the page declaration.
*/
function component() {

  /*
  💡 Page Hook
  
  Use this hook to access the page’s context, which provides both
  commonly used properties and a set of helpful utilities.
  
  This centralizes all page-related data, so components don’t need
  to fetch or pass these values individually.
  */
  const {
    // Page configuration object, containing metadata and setup details.
    config,

    // The team associated with the current user session.
    team,

    // Navigation function (wrapper around react-router-dom’s useNavigate()).
    navigate,

    // The route identifier, if present.
    //  - Returns the ID as a string
    //  - Returns "new" for new-item routes
    //  - Returns null if no ID is available or the id is "new" for new-item routes.
    id,
    // The user of the current session, including identity and profile data.
    user,
  } = usePage()

  console.log(user, config, team, navigate, id)


  const [data, setData] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(true)
  const [showColumnSelection, setShowColumnSelection] = useState(true)
  const [showPagination, setShowPagination] = useState(true)
  const [showSelection, setShowSelection] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showEmptyState, setShowEmptyState] = useState(false)
  const [showCustomEmpty, setShowCustomEmpty] = useState(false)
  const [showCustomToolbar, setShowCustomToolbar] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  /*
  💡 Declarative Menu Configuration
  
  This constant defines a simple, declarative menu outside the component tree.  
  It allows building dropdown menus in a clean and maintainable way, without relying on deeply nested components.
  
  Usage:
  - Can be passed directly to a DataTable.  
  - Can also be used with the <DeclarativeMenu /> component  
    (see: `src/components/declarativemenu.tsx`).  
  
  Features:
  - Supports both regular and nested menus.  
  - Allows icons for visual clarity.  
  - Provides optional confirmation dialogs before executing actions.  
  */

  const menu = [
    {
      title: "Delete", // The label of the menu item
      action: async (v) => {  // The function executed when the item is clicked
        toast.success("Deleted")
      },
      icon: <Trash2 />, // The icon displayed next to the label
      ask: "Are you sure you want to delete this item?", // The confirmation dialog message (optional)
    },
    {
      title: "Notify",
      action: async (v) => {
        toast.success("Notified")
      },
      icon: <Bell />,
      items: [ // Nested menu items
        {
          title: "Approve",
          action: async (v) => {
            toast.success("Approved")
          },
          icon: <BadgeCheck />,
        },
        {
          title: "Deny",
          action: async (v) => {
            toast.success("Denied")
          },
          icon: <Coins />,
        },
      ]
    }
  ] satisfies DropdownMenuContents // Ensures type safety and autocompletion


  useEffect(() => {
    onLoad().then((data) => setData(data))
  }, [])


  // The page component applies the appropriate styles to ensure the layout automatically adapts to and fits the available space.
  return <Page>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <div className="flex">

        {/* 👇 Page Title
            Automatically renders the title defined in the page declaration.  
            If children are provided, they will be rendered instead of the default title. 
        */}
        <PageTitle />
        <div className="grow"></div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Checkbox checked={showSearch} onCheckedChange={(w) => setShowSearch(w == true)} /><Label>Show Search</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={showColumnSelection} onCheckedChange={(w) => setShowColumnSelection(w == true)} /><Label>Show Column Selection</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={showPagination} onCheckedChange={(w) => setShowPagination(w == true)} /><Label>Show Pagination</Label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Checkbox checked={showSelection} onCheckedChange={(w) => setShowSelection(w == true)} /><Label>Show Selection</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={showActions} onCheckedChange={(w) => setShowActions(w == true)} /><Label>Show Actions</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={showCustomEmpty} onCheckedChange={(w) => setShowCustomEmpty(w == true)} /><Label>Use Custom Empty</Label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Checkbox checked={showEmptyState} onCheckedChange={(w) => setShowEmptyState(w == true)} /><Label>Show Empty State</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={showCustomToolbar} onCheckedChange={(w) => setShowCustomToolbar(w == true)} /><Label>Show Custom Toolbar</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={showLoading} onCheckedChange={(w) => setShowLoading(w == true)} /><Label>Show Loading</Label>
            </div>
          </div>

        </div>
      </div>

      {/*  👇 DataTable
    This is the base component used to render tabular data.  
    It comes with a wide range of built-in features, including:
      - Search
      - Column selection
      - Pagination
      - Row selection
      - Row-level actions

    The table header is sticky at the top and supports horizontal scrolling.  
    Both row selection and actions remain fixed to the start and end of the table,  
    ensuring they are always visible while scrolling.
*/}
      <DataTable

        // 👇 Defines the table columns. Uses the default column definition from TanStack Table.
        columns={columns}

        // 👇 Controls whether the local search input is displayed.
        showSearch={showSearch}

        // 👇 Controls whether the column selection menu is displayed.
        showColumnSelection={showColumnSelection}

        // 👇 Controls whether pagination controls are displayed.
        showPagination={showPagination}

        // 👇 Controls whether row selection is enabled.
        showSelection={showSelection}

        // 👇 The table data. If `showEmptyState` is true, an empty dataset is provided instead.
        data={showEmptyState ? emptyData : data}

        // 👇 The loading state of the table.
        loading={showLoading}

        // 👇 The default sorting state of the table.
        sort={["name", "asc"]}

        // 👇 Actions available for each row. If disabled, no menu is provided.
        actions={showActions ? menu : undefined}

        // 👇 The total number of rows in the dataset.
        total={data.length}

        // 👇 Callback executed after a row action is performed.
        onActionExecuted={async () => {
          toast.success("Action Executed")
        }}

        // 👇 Callback triggered when more data is requested. Disabled here since data is preloaded.
        onLoad={null}

        // 👇 Callback triggered when pagination changes.
        onPaginationChange={() => {
          toast.success("Pagination Changed")
        }}

        // 👇 Callback triggered when sorting changes.
        onSortingChange={() => {
          toast.success("Sorting Changed")
        }}

        // 👇 Callback triggered when a row is clicked.
        //     If a string is assigned, navigation is automatically handled and the row’s ID is passed to the target page.
        onRowClick={(row) => {
          toast.success(`Row Clicked: ${row.name}`)
        }}
      >

        {/* Children can be passed to extend the table with custom content */}

        {/* 👇 Custom empty state component */}
        {showCustomEmpty &&
          <EmptyData>
            Nothing to see! 👀
          </EmptyData>
        }

        {/* 👇 Custom toolbar items */}
        {showCustomToolbar &&
          <ToolbarItem>
            <BadgeCheck className="cursor-pointer" />
            <Bell className="cursor-pointer" />
          </ToolbarItem>
        }

      </DataTable>

    </div>
  </Page>

}