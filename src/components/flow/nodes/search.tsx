import { Input, InputTextArea, Row, Select, Slider, Tags, useForm } from '@/components/forms'
import { workerRegistry } from '@/lib/agents/registry'
import { createModel } from '@/lib/data/model'
import { NodeProps } from '@xyflow/react'
import { Search, } from "lucide-react"
import { InlineHandles, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { MemoizedWorker } from '../memoizedworkers'
import { NodeLayout } from './node'
import { ConditionHandler } from '../condition'
import { useEffect, useState, useMemo } from 'react'
import { useTeamStore } from '@/lib/hooks/useTeam'
import { Collection } from '@/pages/knowledge'
import { supabase } from '@/lib/agents/db'

const { search } = workerRegistry

search.icon = Search

const engineList = [
  { label: "Weaviate", value: "weaviate" },
  { label: "Exa", value: "exa" },
  { label: "Supabase", value: "supabase" }
]

const model = createModel({
  fields: {
    engine: { title: "Engine", type: "string", list: engineList },
    maxResults: { title: "Max Results", type: "number" },
    distance: { title: "Distance/Similarity Threshold", type: "number" },
    tooldescription: { title: "Tool Description", type: "string" },
    domain: { title: "Domain (for External Engines)", type: "string[]" },
    collections: { title: "Collections (for Supabase Engine - Multi Needed)", type: "string" }
  }
})


export function SearchNode(props: NodeProps) {
  const { selectedTeam } = useTeamStore()
  const worker = useWorker<SearchWorker>(props.id)
  const [collectionOptions, setCollectionOptions] = useState<{ label: string, value: string }[]>([])

  useEffect(() => {
    async function loadCollections() {
      const { data, error } = await supabase.from('collections')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .order('created_at', { ascending: false })
      if (error) {
        console.error("Error fetching collections:", error)
      } else {
        const options = data.map((coll: Collection) => ({ label: coll.name, value: coll.id }))
        setCollectionOptions(options)
      }
    }
    loadCollections()
  }, [selectedTeam.id])

  const initialCollectionsValue = useMemo(() => {
    const stored = worker.parameters.collections?.[0]
    if (stored && collectionOptions.find(opt => opt.value === stored)) {
      return stored
    }
    return undefined
  }, [worker.parameters.collections, collectionOptions])

  const { form, m, watch, setValue, getValues } = useForm(model, {
    values: {
      engine: worker.parameters.engine || worker.fields.engine.default || "weaviate",
      maxResults: worker.parameters.maxResults || worker.fields.maxResults.default || 5,
      distance: worker.parameters.distance ?? worker.fields.distance.default ?? 0.3,
      domain: Array.isArray(worker.parameters.domain) ? worker.parameters.domain : worker.parameters.domain ? [worker.parameters.domain] : worker.fields.domain.default || [],
      collections: initialCollectionsValue,
      tooldescription: worker.parameters.toolDescription
    }
  })

  const selectedEngine = watch('engine')

  watch((value, { name }) => {
    if (name === "collections" && selectedEngine === 'supabase') {
      const selectedCollections = value.collections ? [value.collections] : undefined
      if (JSON.stringify(worker.parameters.collections) !== JSON.stringify(selectedCollections)) {
        worker.parameters.collections = selectedCollections
        worker.fields.collections.default = value.collections
        console.log("[Watch Collections] Setting worker parameters:", selectedCollections)
      }
    }
    if (name === "engine") {
      worker.parameters.engine = value.engine as any
      worker.fields.engine.default = value.engine
      if (value.engine !== 'supabase') {
        worker.parameters.collections = undefined
        worker.fields.collections.default = undefined
        setValue('collections', undefined)
      }
    }
    if (name === "maxResults") {
      worker.fields.maxResults.default = value.maxResults
    }
    if (name === "distance") {
      const dist = value.distance ?? 0.3
      worker.fields.distance.default = dist
    }
    if (name === "domain" && selectedEngine !== 'supabase') {
      worker.fields.domain.default = value.domain
    }
    if (name === "tooldescription") {
      worker.parameters.toolDescription = value.tooldescription
    }
  })

  return <NodeLayout worker={worker} resizable minHeight={480}>

    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>

    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.tool} />
      <WorkerLabeledHandle handler={worker.fields.references} />
    </InlineHandles>

    <form.context>
      <Row className='py-2 px-2'>
        <Input field={m.tooldescription} span={12} />
      </Row>

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
      <Row className='pb-2 px-2'>
        <Input field={m.distance} type='number' span={12} hideLabel />
      </Row>

      {selectedEngine !== 'supabase' && (
        <>
          <WorkerLabeledHandle handler={worker.fields.domain} />
          <MemoizedWorker worker={worker}>
            <Row className='pb-2 px-2'>
              <Tags span={12} field={m.domain} required />
            </Row>
          </MemoizedWorker>
        </>
      )}

      {selectedEngine === 'supabase' && (
        <>
          <WorkerLabeledHandle handler={worker.fields.collections} />
          <MemoizedWorker worker={worker}>
            <Row className='pb-2 px-2'>
              <Select
                field={m.collections}
                options={collectionOptions}
                span={12}
                hideLabel
                placeholder="Select Collection(s) (Optional)"
              />
            </Row>
          </MemoizedWorker>
        </>
      )}

    </form.context>

    <ConditionHandler />
  </NodeLayout>

}
