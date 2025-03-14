// // import { ExecuteNextHandle, LabeledHandle } from "@/components/flow/handles"
// import { Slider } from '@/components/ui/slider'
// import { NodeProps, Position } from '@xyflow/react'
// import { Brain, BookTemplate, GitFork, Speech } from "lucide-react"
// import { NodeLayout } from './node'
// import { NodeTitle } from '../title'
// import { Button } from "@/components/ui/button"
// import { NodeHandlers } from '../handles'
// import { workerRegistry } from '@/lib/agents/registry'
// import { useWorker } from '../hooks'
// const { stt } = workerRegistry


// stt.icon = Speech

// export function SpeechToText(props: NodeProps) {
//   const worker = useWorker(props.id)

//   return <NodeLayout worker={worker}>
//     <NodeHandlers worker={worker} />
//   </NodeLayout >

// }