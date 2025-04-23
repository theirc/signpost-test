import { app } from "@/lib/app"
import { Binary, Braces, CircleHelp, File, Hash, Link, MessageCircleMore, Type } from "lucide-react"

const iconSize = 12

export function HanlderIcon({ handler, worker }: { handler: NodeIO, worker: AIWorker }) {
  if (!handler) return null

  let type = handler.type

  if (type == "unknown" && handler.direction == "input" && worker) {
    type = worker.inferType(handler, app.agent)
  }

  return <>
    {type == "string" && <Type size={iconSize} className="mt-[8px]" />}
    {type == "number" && <Hash size={iconSize} className="mt-[8px]" />}
    {type == "boolean" && <Binary size={iconSize} className="mt-[8px]" />}
    {type == "unknown" && <CircleHelp size={iconSize} className="mt-[8px]" />}
    {type == "doc" && <File size={iconSize} className="mt-[8px]" />}
    {type == "references" && <Link size={iconSize} className="mt-[8px]" />}

    {type == "chat" && <MessageCircleMore size={iconSize} className="mt-[8px]" />}
    {type == "json" && <Braces size={iconSize} className="mt-[8px]" />}

    {/* {type == "audio" && <Headphones size={iconSize} className="mt-[8px]" />} */}
    {/* {type == "image" && <Image size={iconSize} className="mt-[8px]" />} */}
    {/* {type == "video" && <Video size={iconSize} className="mt-[8px]" />} */}
  </>
}
