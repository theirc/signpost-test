import { workerRegistry } from "@/lib/agents/registry"
const { request } = workerRegistry

export function AddFields(props: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return <div className="w-full px-1 pt-2 -mb-2 flex justify-center" onClick={props.onClick}>
    <div className="text-xs cursor-pointer hover:text-blue-600 hover:font-bold" >+ Add Field</div>
  </div>
}

