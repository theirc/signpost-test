import { Activity, MessageSquare } from "lucide-react"

interface LogsTabsProps {
  activeTab: 'execution' | 'conversation'
  onTabChange: (tab: 'execution' | 'conversation') => void
}

export function LogsTabs({ activeTab, onTabChange }: LogsTabsProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onTabChange('conversation')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'conversation'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <MessageSquare className="h-4 w-4 inline mr-2" />
          Conversation Logs
        </button>
        <button
          onClick={() => onTabChange('execution')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'execution'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Activity className="h-4 w-4 inline mr-2" />
          Execution Logs
        </button>
      </nav>
    </div>
  )
}
