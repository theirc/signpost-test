import { usePage } from "./hooks"

export function PageTitle() {
  const { config } = usePage()

  return <div className="flex flex-col gap-2">
    <div>
      <div className="flex items-center">
        {config.icon && <config.icon className="mr-2" />}
        <h1 className="text-2xl font-bold">{config?.title ?? ""}</h1>
      </div>
    </div>
    <div className="text-muted-foreground">{config?.description ?? ""}</div>
  </div>
}

