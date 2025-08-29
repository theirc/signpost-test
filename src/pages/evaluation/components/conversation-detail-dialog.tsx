import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { ConversationLog } from "../types"

interface ConversationDetailDialogProps {
  conversation: ConversationLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConversationDetailDialog({ conversation, open, onOpenChange }: ConversationDetailDialogProps) {
  if (!conversation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Conversation Details
            <div className="text-sm font-normal text-gray-600">
              UID: {conversation.uid} • Agent: {conversation.agentTitle}
            </div>
          </DialogTitle>
          <DialogDescription>
            Detailed view of the conversation flow and handles.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(95vh-8rem)] w-full pr-4">
          <div className="space-y-6">
            {/* Conversation Header */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700">Started At</div>
                  <div className="text-lg font-semibold text-gray-900 truncate">
                    {format(new Date(conversation.startedAt), "MMM dd, yyyy HH:mm:ss")}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700">Last Activity</div>
                  <div className="text-lg font-semibold text-gray-900 truncate">
                    {format(new Date(conversation.lastActivity), "MMM dd, yyyy HH:mm:ss")}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Total Steps</div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {conversation.totalSteps} conversation steps
                </Badge>
              </div>
            </div>

            {/* Conversation Steps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Conversation Flow</h3>
              {conversation.conversationSteps.map((step, index) => (
                <div key={step.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Step Header */}
                  <div className={`p-4 ${
                    step.worker === 'request' ? 'bg-green-50 border-b border-green-200' : 'bg-purple-50 border-b border-purple-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          Step {index + 1} of {conversation.totalSteps}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(step.created_at), "HH:mm:ss")}
                      </div>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="p-4 space-y-4">
                    {/* Message - Show in header area */}
                    {step.handles && step.handles.find((h: any) => h.name === 'message') && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Message</div>
                        <div className="bg-gray-50 p-3 rounded border text-sm text-gray-800 whitespace-pre-wrap">
                          {step.handles.find((h: any) => h.name === 'message')?.value || ''}
                        </div>
                      </div>
                    )}

                    {/* Response - Show in main area */}
                    {step.handles && step.handles.find((h: any) => h.name === 'response') && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Response</div>
                        <div className="bg-gray-50 p-3 rounded border text-sm text-gray-800 whitespace-pre-wrap">
                          {step.handles.find((h: any) => h.name === 'response')?.value || ''}
                        </div>
                      </div>
                    )}

                    {/* Quick Replies - If present */}
                    {step.handles && step.handles.find((h: any) => h.name === 'quick_replies') && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Quick Replies</div>
                        <div className="bg-gray-50 p-3 rounded border text-sm text-gray-800">
                          <pre className="text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap break-words">
                            {JSON.stringify(step.handles.find((h: any) => h.name === 'quick_replies')?.value, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
