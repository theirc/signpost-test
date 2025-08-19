import { InlineHandles, NodeHandlers, WorkerLabeledHandle } from "@/components/flow/handles"
import { Row, Select, useForm } from "@/components/forms"
import { InputTextArea } from "@/components/forms/textarea"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { NodeProps, useNodeConnections } from '@xyflow/react'
import { Brain, Eye, Type } from "lucide-react"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { MemoizedWorker } from "../memoizedworkers"
import { SwirlingEffectSpinner } from "../progress"
import { useEffect, useRef, useState } from "react"
import { agentsModel } from "@/lib/data"
import { useTeamStore } from "@/lib/hooks/useTeam"
const { agentWorker } = workerRegistry
agentWorker.icon = Brain

const model = createModel({
  fields: {
    agent: { title: "Agent", type: "number" },
  }
})


interface ParametersProps {
  worker: AgentWorker
  list?: FieldList
  onChange?: (value: number) => void
}


function Parameters({ worker, list, onChange }: ParametersProps) {

  const { form, m, watch, } = useForm(model, {
    values: {
      agent: worker.parameters.agent,
    }
  })

  watch((value, { name }) => {
    if (name === "agent") {
      console.log("Watch Agent changed: ", value.agent)

      worker.parameters.agent = value.agent
      // if (onChange) onChange(value.agent)
    }
  })

  function onChangeS(v) {
    onChange?.(v)
    console.log("OnChange Select:", v)
  }


  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='py-2'>
        <Select field={m.agent} span={12} options={list} onChange={onChangeS} />
      </Row>
    </div>
  </form.context>

}


export function AgentNode(props: NodeProps) {

  const list = useRef<FieldList>([])
  const [isLoading, setLoading] = useState(true)
  const worker = useWorker<AgentWorker>(props.id)
  const { selectedTeam } = useTeamStore()

  useEffect(() => {
    async function loadAgents() {
      if (!selectedTeam?.id) {
        setLoading(false)
        list.current = []
        return
      }
      
      setLoading(true)
      try {
        const { data, error } = await agentsModel.data.select("*").eq('team_id', selectedTeam.id)
        
        if (error) {
          console.error("Error loading agents:", error)
          list.current = []
        } else if (data) {
          console.log(`Loaded ${data.length} agents for team:`, selectedTeam.id)
          list.current = data.map((a) => {
            return { value: a.id, label: a.title }
          })
        } else {
          list.current = []
        }
      } catch (error) {
        console.error("Error loading agents:", error)
        list.current = []
      } finally {
        setLoading(false)
      }
    }
    
    loadAgents()
  }, [selectedTeam?.id])

  async function onAgentChange(agentId: number) {
    console.log("Agent Changed: ", agentId, "Team ID:", selectedTeam?.id)

    if (!agentId) return
    if (!selectedTeam?.id) {
      console.error("No team selected")
      return
    }
    
    setLoading(true)
    try {
      await worker.loadAgent(selectedTeam.id)
      console.log("Agent loaded successfully")
    } catch (error) {
      console.error("Error loading agent:", error)
    } finally {
      setLoading(false)
    }
  }


  return <NodeLayout worker={worker} className="flex flex-col">
    {isLoading && <div className="flex flex-col items-center justify-center size-full">
      <SwirlingEffectSpinner />
    </div>}

    {!isLoading && <>
      <MemoizedWorker worker={worker} name="parameters">
        <Parameters worker={worker} list={list.current} onChange={onAgentChange} />
      </MemoizedWorker>
      <NodeHandlers worker={worker} />

    </>
    }
  </NodeLayout >

}

