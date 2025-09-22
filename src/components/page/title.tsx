import { useFormContext } from "react-hook-form"
import { usePage } from "./hooks"

interface Props {
  children?: React.ReactNode
}

export function PageTitle(props: Props) {

  const { config } = usePage()


  return <div className="flex">
    <div className="flex flex-col gap-2">
      <div>
        <div className="flex items-center">
          {config.icon && <config.icon className="mr-2" />}
          <h1 className="text-2xl font-bold">{config?.title ?? ""}</h1>
        </div>
      </div>
      <div className="text-muted-foreground">{config?.description ?? ""}</div>
    </div>
    {props.children && <>
      <div className="grow"></div>
      <div>
        {props.children}
      </div>
    </>}
  </div>


}

