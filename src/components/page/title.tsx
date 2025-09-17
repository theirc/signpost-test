import { usePage } from "./hooks"

export function PageTitle() {
  const page = usePage()
  return <div className="flex flex-col gap-2">
    <div>
      <div className="flex items-center">
        <page.icon className="mr-2" />
        <h1 className="text-2xl font-bold">{page.title}</h1>
      </div>
    </div>
    <div className="text-muted-foreground">{page.description}</div>
  </div>
}

