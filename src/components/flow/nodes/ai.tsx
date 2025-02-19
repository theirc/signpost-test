import { useCallback, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LabeledHandle } from "@/components/labeled-handle"
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Brain, Settings } from "lucide-react"
import { NodeTitle } from './title'
import { NodeLayout } from './node'
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select'
import { Switch } from "@/components/ui/switch"

// Sample bots data (this would come from your bots.tsx in reality)
const sampleBots = [
  {
    id: 'bot-1',
    name: 'Crisis Response Coordinator',
    model: 'gpt-4',
  },
  {
    id: 'bot-2',
    name: 'Field Medic Assistant',
    model: 'claude-3-opus',
  },
  {
    id: 'bot-3',
    name: 'Refugee Support Guide',
    model: 'gpt-4',
  }
]

export function AINode({ data, isConnectable }) {
  const [selectedBot, setSelectedBot] = useState<string>('')
  const [useConstitution, setUseConstitution] = useState(false)
  const [constitution, setConstitution] = useState('')

  return <NodeLayout>
    <NodeTitle title="AI" icon={Brain} />
    <LabeledHandle id="input" title="Input" type="target" position={Position.Left} />
    <LabeledHandle id="prompt" title="Prompt" type="target" position={Position.Left} />
    
    <div className='p-4 nodrag'>
      <div className='mb-4'>
        <Label>Select Bot</Label>
        <Select
          value={selectedBot}
          onValueChange={setSelectedBot}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a bot" />
          </SelectTrigger>
          <SelectContent>
            {sampleBots.map((bot) => (
              <SelectItem key={bot.id} value={bot.id}>
                {bot.name} ({bot.model})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='mb-4 flex items-center space-x-2'>
        <Switch
          checked={useConstitution}
          onCheckedChange={setUseConstitution}
        />
        <Label>Enable Constitutional AI</Label>
      </div>

      {useConstitution && (
        <div className='mb-4'>
          <Label>Constitution</Label>
          <Textarea
            value={constitution}
            onChange={(e) => setConstitution(e.target.value)}
            placeholder="Enter constitutional rules..."
            className="min-h-[100px]"
          />
        </div>
      )}
    </div>

    <LabeledHandle id="output" title="Output" type="source" position={Position.Right} />
  </NodeLayout>
}





