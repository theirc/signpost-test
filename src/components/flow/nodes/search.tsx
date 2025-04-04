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

function Parameters({ worker }: { worker: SearchWorker }) {
  const { form, m, watch } = useForm(model, {
    values: {
      maxResults: worker.parameters.maxResults || 5,
      engine: worker.parameters.engine || "weaviate",
      domain: worker.parameters.domain || "",
      distance: worker.parameters.distance || 0.2,
    }
  })

  watch((value, { name }) => {
    if (name === "engine") worker.parameters.engine = value.engine
    if (name === "maxResults") worker.parameters.maxResults = value.maxResults
    if (name === "domain") worker.parameters.domain = value.domain
    if (name === "distance") worker.parameters.distance = value.distance || 0.2
  })

  return <form.context>
    <div className='p-2 mt-2 nodrag w-full flex-grow'>
      <Row className='pb-8 px-2'>
        <Select field={m.engine} span={12} />
      </Row>
      <Row className='pb-8 px-2'>
        <Input field={m.maxResults} type="number" span={12} />
      </Row>
      <Row className='pb-8 px-2'>
        <Input field={m.distance} type='number' span={12} />
      </Row>
      <Row className='pb-8 px-2'>
        <Input field={m.domain} span={12} />
      </Row>
    </div>
  </form.context>

}

export function SearchNode(props: NodeProps) {
  const worker = useWorker<SearchWorker>(props.id)

  return <NodeLayout worker={worker} resizable minHeight={250}>

    <div className='flex flex-col h-full'>
      <InlineHandles>
        <WorkerLabeledHandle handler={worker.fields.input} />
        <WorkerLabeledHandle handler={worker.fields.output} />
      </InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.references} />
      <MemoizedWorker worker={worker}>
        <Parameters worker={worker} />
      </MemoizedWorker>
    </div>
  </NodeLayout>

}
