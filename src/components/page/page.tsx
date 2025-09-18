
export function Page(props: React.HTMLAttributes<HTMLDivElement>) {
  const { children } = props
  return <div className="flex flex-col flex-1 p-4 overflow-y-auto min-h-0 h-full" id="page" {...props}>
    {children}
  </div>
}

