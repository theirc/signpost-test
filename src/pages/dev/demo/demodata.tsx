
type Item = {
  id?: any
  name?: string
  email?: string
  location?: string
  flag?: string
  status?: "Active" | "Inactive" | "Pending"
  balance?: number
  department?: string
  role?: string
  joinDate?: string
  lastActive?: string
  performance?: "Excellent" | "Good" | "Average" | "Poor"
}

export const columns: Columns<Item> = {
  name: { header: "Name" },
  email: { header: "Email", },
  status: { header: "Status", },
  department: { header: "Department", },
  role: { header: "Role", },
  joinDate: { header: "Join Date", },
  lastActive: { header: "Last Active", },
  performance: { header: "Performance", },
  location: {
    header: "Location",
    cell: ({ row }) => (
      <div className="truncate">
        <span className="text-lg leading-none">{row.original.flag}</span>{" "}
        {row.getValue("location")}
      </div>
    ),
  },
  balance: {
    header: "Balance",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("balance"))
      const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", }).format(amount)
      return formatted
    },
  },
}

export async function onLoad(state?: PaginationData) {
  const res = await fetch("https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/users-01_fertyx.json")
  const data = await res.json()
  return data
}