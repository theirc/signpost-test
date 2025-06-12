import { workerRegistry } from '@/lib/agents/registry'
import { NodeProps } from '@xyflow/react'
import { Combine } from "lucide-react"
import { useState, useEffect } from 'react'
import { NodeHandlers, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { NodeLayout } from './node'
import { createModel } from '@/lib/data/model'
import { Row, Select, useForm } from '@/components/forms'
import { MemoizedWorker } from '../memoizedworkers'
import { app } from '@/lib/app'
import { useForceUpdate } from '@/lib/utils'
const { combine } = workerRegistry

const list = [
  { label: "Non Empty", value: "nonempty" },
  { label: "Concatenate", value: "concat" },
]

// Generate input count options from 1 to 10
const inputCountOptions = Array.from({ length: 10 }, (_, i) => {
  const count = i + 1
  return { label: `${count} Input${count === 1 ? '' : 's'}`, value: count }
})

const model = createModel({
  fields: {
    mode: { title: "Action", type: "string", list },
    inputCount: { title: "Number of Inputs", type: "number", list: inputCountOptions },
  }
})

function Parameters({ worker, forceUpdate }: { worker: CombineWorker, forceUpdate: () => void }) {
  const { form, m, watch } = useForm(model, {
    values: {
      mode: worker.parameters.mode,
      inputCount: worker.parameters.inputCount || 2,
    }
  })

  watch((value, { name }) => {
    if (name === "mode") worker.parameters.mode = value.mode as any
    if (name === "inputCount") {
      const newCount = value.inputCount as number
      const currentCount = worker.parameters.inputCount || 2

      // Only update if the count has changed
      if (newCount !== currentCount) {
        worker.parameters.inputCount = newCount

        // Get all existing numbered input handlers (input1, input2, etc.)
        const existingInputs = Object.entries(worker.fields)
          .filter(([key]) => /^input\d+$/.test(key))
          .map(([key]) => key)

        // Remove input handlers that are no longer needed
        existingInputs.forEach(inputName => {
          const inputNum = parseInt(inputName.replace('input', ''))
          if (inputNum > newCount) {
            worker.deleteHandler(worker.fields[inputName].id)
            delete worker.fields[inputName]
          }
        })

        // Add new input handlers if needed
        for (let i = 1; i <= newCount; i++) {
          const inputName = `input${i}`
          if (!worker.fields[inputName]) {
            worker.addHandler({
              type: "unknown",
              direction: "input",
              title: `Input ${i}`,
              name: inputName
            })
          }
        }

        // Force a re-render of the node
        worker.updateWorker()

        // Force a re-render of the agent to propagate changes
        if (app.agent) {
          app.agent.update()
        }

        // Force an immediate React rerender
        forceUpdate()
      }
    }
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='py-2'>
        <Select field={m.mode} span={12} />
      </Row>
      <Row className='py-2'>
        <Select field={m.inputCount} span={12} />
      </Row>
    </div>
  </form.context>
}


export function CombineNode(props: NodeProps) {

  const worker = useWorker(props.id) as CombineWorker

  // Add state to force rerenders
  const update = useForceUpdate()

  // Listen for worker updates
  useEffect(() => {
    const originalUpdateWorker = worker.updateWorker

    // Override the updateWorker method to also trigger our state update
    worker.updateWorker = function () {
      originalUpdateWorker.call(worker)
      update()
    }

    return () => {
      // Restore original method on cleanup
      worker.updateWorker = originalUpdateWorker
    }
  }, [worker])

  if (!worker) return null

  if (!worker.parameters.inputCount) {
    worker.parameters.inputCount = 2
  }


  // Get all existing numbered input handlers (input1, input2, etc.)
  const existingInputs = Object.entries(worker.fields)
    .filter(([key]) => /^input\d+$/.test(key))
    .map(([key]) => key)

  // Remove input handlers that are no longer needed
  existingInputs.forEach(inputName => {
    const inputNum = parseInt(inputName.replace('input', ''))
    if (inputNum > worker.parameters.inputCount) {
      worker.deleteHandler(worker.fields[inputName].id)
      delete worker.fields[inputName]
    }
  })

  // Ensure we have all the required input handlers
  const inputCount = worker.parameters.inputCount
  for (let i = 1; i <= inputCount; i++) {
    const inputName = `input${i}`
    if (!worker.fields[inputName]) {
      worker.addHandler({
        type: "unknown",
        direction: "input",
        title: `Input ${i}`,
        name: inputName
      })
    }
  }

  // Infer types from connected inputs
  let inferredType: IOTypes = "unknown"

  // Find the first non-unknown type from inputs
  for (let i = 1; i <= inputCount; i++) {
    const inputField = worker.fields[`input${i}`]
    if (inputField) {
      const fieldType = worker.inferType(inputField, app.agent)
      if (fieldType !== "unknown") {
        inferredType = fieldType
        break
      }
    }
  }

  // Apply the inferred type to all inputs and output
  for (let i = 1; i <= inputCount; i++) {
    const inputField = worker.fields[`input${i}`]
    if (inputField) {
      inputField.type = inferredType
    }
  }
  worker.fields.output.type = inferredType

  // Render all input handles
  const inputHandles = []
  for (let i = 1; i <= inputCount; i++) {
    const inputField = worker.fields[`input${i}`]
    if (inputField) {
      inputHandles.push(
        <WorkerLabeledHandle key={`input-${i}`} handler={inputField} />
      )
    }
  }

  return <NodeLayout worker={worker}>
    {inputHandles}

    {/* Don't render additional NodeHandlers since we're explicitly rendering our input handles */}
    <WorkerLabeledHandle handler={worker.fields.output} />

    <div className='w-full flex'>
      <MemoizedWorker worker={worker}>
        <Parameters
          worker={worker}
          forceUpdate={update}
        />
      </MemoizedWorker>
    </div>
  </NodeLayout>
}

combine.icon = Combine
