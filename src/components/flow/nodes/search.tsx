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
import { useEffect, useState } from 'react'
import { fetchCollections, Collection } from '@/lib/data/supabaseFunctions'

const { search } = workerRegistry

search.icon = Search

const engineList = [
  { label: "Weaviate", value: "weaviate" },
  { label: "Exa", value: "exa" },
]

const model = createModel({
  fields: {
    engine: { title: "Engine", type: "string", list: engineList },
    maxResults: { title: "Max Results", type: "number" },
    domain: { title: "Domain", type: "string" },
    distance: { title: "Distance", type: "number" },
    collection: { title: "Collection (Supabase)", type: "string" }
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
  const [collectionOptions, setCollectionOptions] = useState<{ label: string, value: string }[]>([])

  useEffect(() => {
    async function loadCollections() {
      const { data, error } = await fetchCollections()
      if (error) {
        console.error("Error fetching collections:", error)
      } else {
        const options = data.map((coll: Collection) => ({ label: coll.name, value: coll.id }))
        setCollectionOptions(options)
      }
    }
    loadCollections()
  }, [])

  const { form, m, watch } = useForm(model, {
    values: {
      engine: worker.fields.engine.default || "weaviate",
      maxResults: worker.fields.maxResults.default || 5,
      distance: worker.fields.distance.default || 0.2,
      domain: worker.fields.domain.default || "",
      collection: worker.parameters.collection || worker.fields.collection.default || undefined
    }
  })

  watch((value, { name }) => {
    if (name === "engine") {
      worker.parameters.engine = value.engine as any
      worker.fields.engine.default = value.engine
    }
    if (name === "maxResults") {
      worker.parameters.maxResults = value.maxResults
      worker.fields.maxResults.default = value.maxResults
    }
    if (name === "distance") {
      const dist = value.distance || 0.2
      worker.parameters.distance = dist
      worker.fields.distance.default = dist
    }
    if (name === "domain") {
      worker.parameters.domain = value.domain
      worker.fields.domain.default = value.domain
    }
    if (name === "collection") {
      const selectedCollection = value.collection || undefined
      worker.parameters.collection = selectedCollection
      worker.fields.collection.default = selectedCollection
    }
  })

  return <NodeLayout worker={worker} resizable minHeight={480}>

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

      <WorkerLabeledHandle handler={worker.fields.collection} />
      <MemoizedWorker worker={worker}>
        <Row className='pb-2 px-2'>
          <Select 
            field={m.collection} 
            options={collectionOptions} 
            span={12} 
            hideLabel 
            placeholder="Select Collection (Optional)" 
          />
        </Row>
      </MemoizedWorker>

    </form.context>

    <ConditionHandler />
  </NodeLayout>

}
