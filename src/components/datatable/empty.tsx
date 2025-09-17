import { TableBody, TableCell, TableRow } from "@/components/ui/table"

export function EmptyData({ children = "No results." }: { children?: React.ReactNode }) {
  return <TableBody>
    <TableRow>
      <TableCell colSpan={1000} className="h-24 text-center">
        <div className="absolute w-full flex items-center justify-center">
          <div className="pt-40">
            {children}
          </div>
        </div>
      </TableCell>
    </TableRow>
  </TableBody>


}