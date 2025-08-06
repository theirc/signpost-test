import { app } from '@/lib/app'
import { AllAIModels } from '@/lib/agents/modellist'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTeamStore } from '@/lib/hooks/useTeam'
import { Collection } from '@/pages/knowledge'
import { supabase } from '@/lib/agents/db'
import { Label } from '@/components/ui/label'
import { useQuery } from '@tanstack/react-query'

interface ParameterInputProps {
  workerId: string
  paramKey: string
  paramValue: any
  source: 'parameters' | 'fields'
  workerType?: string
  label?: string
}

const selectOptions = {
  model: AllAIModels,
  sumarizationModel: AllAIModels,
  engine: [
    { label: "Weaviate", value: "weaviate" },
    { label: "Exa", value: "exa" },
    { label: "Supabase", value: "supabase" }
  ],
  mode: [
    { label: "Non Empty", value: "nonempty" },
    { label: "Concatenate", value: "concat" }
  ],
  contentType: [
    { label: "Text", value: "text" },
    { label: "Number", value: "number" },
    { label: "Audio", value: "audio" },
    { label: "Image", value: "image" },
    { label: "File", value: "file" },
    { label: "Timestamp", value: "Timestamp" }
  ]
};

type SelectKeys = keyof typeof selectOptions;

function useCollections(teamId: string | undefined) {
  return useQuery({
    queryKey: ['collections', teamId],
    queryFn: async () => {
      if (!teamId) return []
      const { data, error } = await supabase.from('collections')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
      if (error) {
        console.error("Error fetching collections:", error)
        return []
      }
      return data.map((coll: Collection) => ({ label: coll.name, value: coll.id }))
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function ParameterInput({ workerId, paramKey, paramValue, source, workerType, label }: ParameterInputProps) {
  const { selectedTeam } = useTeamStore()
  const { data: collectionOptions = [] } = useCollections(selectedTeam?.id)

  const worker = app.agent.workers[workerId]

  const handleBlur = useCallback((value: any) => {
    const worker = app.agent.workers[workerId]
    if (worker) {
      if (source === 'parameters') {
        worker.parameters[paramKey] = value
      } else {
        const field = worker.fields[paramKey]
        if (field) {
          if (field.mock !== undefined) {
            field.mock = value
          } else {
            field.default = value
          }
        }
      }
      worker.updateWorker()
      app.agent.update()
    }
  }, [workerId, paramKey, source])

  const handleEngineChange = useCallback((value: string) => {
    const worker = app.agent.workers[workerId]
    if (worker && workerType === 'search') {
      worker.parameters.engine = value as any
      if (worker.fields.engine) {
        worker.fields.engine.default = value
      }

      if (value !== 'supabase') {
        worker.parameters.collections = undefined
        if (worker.fields.collections) {
          worker.fields.collections.default = undefined
        }
      }

      worker.updateWorker()
      app.agent.update()
    }
  }, [workerId, workerType])

  if (workerType === 'search') {
    const currentEngine = worker?.parameters?.engine || 'weaviate'

    if (paramKey === 'domain' && currentEngine === 'supabase') {
      return null
    }
    if (paramKey === 'collections' && currentEngine !== 'supabase') {
      return null
    }
    if (paramKey === 'engine') {
      return (
        <>
          <Label className="text-sm font-medium text-gray-700 capitalize">{label}</Label><Select onValueChange={handleEngineChange} defaultValue={paramValue}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.engine.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )
    }
    if (paramKey === 'collections' && currentEngine === 'supabase') {
      console.log('paramValue', paramValue)
      return (
        <>
          <Label className="text-sm font-medium text-gray-700 capitalize">{label}</Label>
          <Select onValueChange={(value) => handleBlur(value)} defaultValue={paramValue[0]}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Collection(s) (Optional)" />
            </SelectTrigger>
            <SelectContent>
              {collectionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )
    }
    if (paramKey === 'domain' && currentEngine !== 'supabase') {
      return (
        <>
          <Label className="text-sm font-medium text-gray-700 capitalize">{label}</Label>
          <Input
            type="text"
            defaultValue={paramValue}
            onBlur={(e) => handleBlur(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter domain(s) separated by commas"
          />
        </>
      )
    }
  }

  if (paramKey in selectOptions) {
    return (
      <>
        <Label className="text-sm font-medium text-gray-700 capitalize">{label}</Label>
        <Select onValueChange={(value) => handleBlur(value)} defaultValue={paramValue}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {selectOptions[paramKey as SelectKeys].map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </>
    )
  }

  if (paramKey === 'temperature') {
    return (
      <>
        <Label className="text-sm font-medium text-gray-700 capitalize">{label}</Label>
        <Input
          type="range"
          min="0"
          max="1"
          step="0.1"
          defaultValue={paramValue}
          onBlur={(e) => handleBlur(parseFloat(e.target.value))}
          className="mt-1 block w-full"
        />
      </>
    )
  }

  if (typeof paramValue === 'string' && paramValue.length > 50) {
    return (
      <>
        <Label className="text-sm font-medium text-gray-700 capitalize">{label}</Label>
        <Textarea
          defaultValue={paramValue}
          onBlur={(e) => handleBlur(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          rows={10}
        />
      </>
    )
  }

  return (
    <>
      <Label className="text-sm font-medium text-gray-700 capitalize">{label}</Label>
      <Input
        type={typeof paramValue === 'number' ? 'number' : 'text'}
        defaultValue={paramValue}
        onBlur={(e) => handleBlur(e.target.value)}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </>
  )
}
