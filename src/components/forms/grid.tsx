import { cn } from "@/lib/utils"

declare global {
  type ColumnSpans = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
}

export function Row(props: React.ComponentProps<"div">) {
  return <div className={cn("grid grid-flow-row-dense grid-cols-12 gap-4", props.className)}>
    {props.children}
  </div>
}

interface ColProps extends React.ComponentProps<"div"> {
  span?: number
}

const spans = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
}

export function Col({ span, className, ...props }: ColProps = { span: 4 }) {
  return <div className={cn("overflow-hidden", spans[span || "col-span-4"], className)} {...props} >
    {props.children}
  </div>
}

