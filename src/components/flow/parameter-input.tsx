import { app } from '@/lib/app'
import { AllAIModels } from '@/lib/agents/modellist'

interface ParameterInputProps {
  workerId: string
  paramKey: string
  paramValue: any
}

export function ParameterInput({ workerId, paramKey, paramValue }: ParameterInputProps) {
  const handleBlur = (value: any) => {
    const worker = app.agent.workers[workerId]
    if (worker) {
      worker.parameters[paramKey] = value
      app.agent.update()
    }
  }

  if (paramKey === 'model') {
    return (
      <select
        defaultValue={paramValue}
        onBlur={(e) => handleBlur(e.target.value)}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        {AllAIModels.map((model) => (
          <option key={model.value} value={model.value}>
            {model.label}
          </option>
        ))}
      </select>
    )
  }

  if (paramKey === 'temperature') {
    return (
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        defaultValue={paramValue}
        onBlur={(e) => handleBlur(parseFloat(e.target.value))}
        className="mt-1 block w-full"
      />
    )
  }
  
  if (typeof paramValue === 'string' && paramValue.length > 50) {
    return (
      <textarea
        defaultValue={paramValue}
        onBlur={(e) => handleBlur(e.target.value)}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        rows={4}
      />
    )
  }

  return (
    <input
      type={typeof paramValue === 'number' ? 'number' : 'text'}
      defaultValue={paramValue}
      onBlur={(e) => handleBlur(e.target.value)}
      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    />
  )
}
