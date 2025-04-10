import { Input, InputTextArea, Row, Select, Slider, useForm } from '@/components/forms'
import { workerRegistry } from '@/lib/agents/registry'
import { createModel } from '@/lib/data/model'
import { NodeProps } from '@xyflow/react'
import { Search, } from "lucide-react"
import { InlineHandles, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { MemoizedWorker } from '../memoizedworkers'
import { NodeLayout } from './node'
import { AllAIModels, OpenAIModels } from '@/lib/agents/modellist'
import { ConditionHandler } from '../condition'
const { search } = workerRegistry

search.icon = Search

const list = [
  { label: "Weaviate", value: "weaviate" },
  { label: "Exa", value: "exa" },
]

const model = createModel({
  fields: {
    engine: { title: "Engine", type: "string", list },
    maxResults: { title: "Max Results", type: "number" },
    domain: { title: "Domain", type: "string" },
    distance: { title: "Distance", type: "number" },
  }
})

// function Parameters({ worker }: { worker: SearchWorker }) {
//   const { form, m, watch } = useForm(model, {
//     values: {
//       maxResults: worker.parameters.maxResults || 5,
//       engine: worker.parameters.engine || "weaviate",
//       domain: worker.parameters.domain || "",
//       distance: worker.parameters.distance || 0.2,
//     }
//   })

//   watch((value, { name }) => {
//     if (name === "engine") worker.parameters.engine = value.engine as any
//     if (name === "maxResults") worker.parameters.maxResults = value.maxResults
//     if (name === "domain") worker.parameters.domain = value.domain
//     if (name === "distance") worker.parameters.distance = value.distance || 0.2
//   })

//   return <form.context>
//     <div className='p-2 mt-2 nodrag w-full flex-grow'>
//       <Row className='pb-2'>
//         <Select field={m.engine} span={12} />
//       </Row>
//       <Row className='pb-2'>
//         <Input field={m.maxResults} type="number" span={12} />
//       </Row>
//       <Row className='pb-2'>
//         <Input field={m.distance} type='number' span={12} />
//       </Row>
//       <Row className='pb-2'>
//         <Input field={m.domain} span={12} />
//       </Row>
//     </div>
//   </form.context>
// }


export function SearchNode(props: NodeProps) {
  const worker = useWorker<SearchWorker>(props.id)

  const { form, m, watch } = useForm(model, {
    values: {
      engine: worker.fields.engine.default || "weaviate",
      maxResults: worker.fields.maxResults.default || 5,
      distance: worker.fields.distance.default || 0.2,
      domain: worker.fields.domain.default || "",
    }
  })

  watch((value, { name }) => {
    if (name === "engine") worker.fields.engine.default = value.engine
    if (name === "maxResults") worker.fields.maxResults.default = value.maxResults
    if (name === "distance") worker.fields.distance.default = value.distance || 0.2
    if (name === "domain") worker.fields.domain.default = value.domain
  })

  return <NodeLayout worker={worker} resizable minHeight={420}>

    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>
    <WorkerLabeledHandle handler={worker.fields.references} />

    <form.context>

      <WorkerLabeledHandle handler={worker.fields.engine} />
      <MemoizedWorker worker={worker}>
        <Row className='pb-2 px-2'>
          <Select field={m.engine} span={12} hideLabel />
        </Row>
      </MemoizedWorker>

      <WorkerLabeledHandle handler={worker.fields.maxResults} />
      <MemoizedWorker worker={worker}>
        <Row className='pb-2 px-2'>
          <Input field={m.maxResults} type="number" span={12} hideLabel />
        </Row>
      </MemoizedWorker>

      <WorkerLabeledHandle handler={worker.fields.distance} />
      <MemoizedWorker worker={worker}>
        <Row className='pb-2 px-2'>
          <Input field={m.distance} type='number' span={12} hideLabel />
        </Row>
      </MemoizedWorker>

      <WorkerLabeledHandle handler={worker.fields.domain} />
      <MemoizedWorker worker={worker}>
        <Row className='pb-2 px-2'>
          <Input field={m.domain} span={12} hideLabel />
        </Row>
      </MemoizedWorker>

    </form.context>

    <ConditionHandler />
  </NodeLayout>

}
