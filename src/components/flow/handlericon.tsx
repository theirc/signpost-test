import { app } from "@/lib/app"
import { Connection, Handle, HandleProps, Position, useNodeConnections } from "@xyflow/react"
import { Binary, BookMarked, CircleHelp, File, Hash, Headphones, Image, Link, MessageCircleMore, Type, Video } from "lucide-react"
import React, { useContext } from "react"
import { MemoizedWorker } from "./memoizedworkers"
import { cn } from "@/lib/utils"
import { useWorkerContext } from "./hooks"

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
    {/* {type == "audio" && <Headphones size={iconSize} className="mt-[8px]" />} */}
    {/* {type == "image" && <Image size={iconSize} className="mt-[8px]" />} */}
    {/* {type == "video" && <Video size={iconSize} className="mt-[8px]" />} */}
  </>
}
