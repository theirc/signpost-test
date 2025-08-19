import { Row, Select, useForm } from '@/components/forms'
import { createModel } from '@/lib/data/model'
import type { DocumentGeneratorWorker } from '@/lib/agents/workers/documentgenerator'
import { NodeProps } from '@xyflow/react'
import { InlineHandles, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { MemoizedWorker } from '../memoizedworkers'
import { NodeLayout } from './node'
import { FileText } from 'lucide-react'
import { workerRegistry } from '@/lib/agents/registry'

const { documentGenerator } = workerRegistry
documentGenerator.icon = FileText

const docTypeOptions = [
  { value: "docx", label: "DOCX" },
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
]

const model = createModel({
  fields: {
    doc: { title: "Document Type", type: "string", list: docTypeOptions },
  }
})

function Parameters({ worker }: { worker: DocumentGeneratorWorker }) {
  const { form, m, watch } = useForm(model, {
    values: {
      doc: worker.parameters.doc || 'docx',
    }
  })

  watch((value, { name }) => {
    if (name === "doc") worker.parameters.doc = value.doc;
  })

  return (
    <form.context>
      <div className='p-2 -mt-2 nodrag w-full space-y-3'>
        <div>
          <h3 className="font-semibold text-sm mb-2">Document Configuration</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Receives input from AI workers and generates files in DOCX, PDF, or CSV format
          </p>
          <Row>
            <Select field={m.doc} span={12} />
          </Row>
        </div>
      </div>
    </form.context>
  );
}

export function DocumentGeneratorNode(props: NodeProps) {
  const worker = useWorker<DocumentGeneratorWorker>(props.id)
  
  return (
    <NodeLayout worker={worker} resizable>
      <div className='flex flex-col h-full'>
        <InlineHandles>
          <WorkerLabeledHandle handler={worker.fields.input} />
          <WorkerLabeledHandle handler={worker.fields.output} />
        </InlineHandles>
        
        <MemoizedWorker worker={worker}>
          <Parameters worker={worker} />
        </MemoizedWorker>
      </div>
    </NodeLayout>
  );
}
