import { useCallback, useState } from 'react'
import { Settings } from "lucide-react"
import { Handle, Position } from '@xyflow/react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LabeledHandle } from "@/components/labeled-handle"
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'

interface Props {
  icon: any
  title: string
}

export function NodeTitle({ title, icon, children }: Props & React.ComponentProps<"div">) {
  const Icon = icon || Settings
  return <div className='w-full p-1 pl-2 bg-yellow-200 text-sm flex border-b-gray-200 border-b'>
    <Icon size={16} className='mr-1 mt-[2px] text-gray-600' />
    <div>{title || "Title"}</div>
  </div>
}





