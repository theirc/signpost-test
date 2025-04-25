// import { useCallback, useState } from 'react'
// import { Settings, Trash2 } from "lucide-react"
// import { Handle, Position, useReactFlow } from '@xyflow/react'
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { LabeledHandle } from "@/components/labeled-handle"
// import { cn } from '@/lib/utils'
// import { Slider } from '@/components/ui/slider'
// import { Button } from "@/components/ui/button"

// interface Props {
//   icon: any
//   title: string
// }

// export function NodeTitle({ title, icon, children }: Props & React.ComponentProps<"div">) {
//   const Icon = icon || Settings
//   const { deleteElements } = useReactFlow()

//   const handleDelete = () => {
//     // Get the node id from the closest parent with data-id attribute
//     const nodeElement = document.activeElement?.closest('[data-id]')
//     if (nodeElement) {
//       const nodeId = nodeElement.getAttribute('data-id')
//       if (nodeId) {
//         deleteElements({ nodes: [{ id: nodeId }] })
//       }
//     }
//   }

//   return <div className='w-full p-1 pl-2 bg-yellow-200 text-sm flex border-b-gray-200 border-b relative group'>
//     <Icon size={16} className='mr-1 mt-[2px] text-gray-600' />
//     <div>{title || "Title"}</div>
//     <Button
//       variant="ghost"
//       size="icon"
//       className="absolute top-[2px] right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
//       onClick={handleDelete}
//     >
//       <Trash2 className="h-4 w-4" />
//     </Button>
//   </div>
// }





