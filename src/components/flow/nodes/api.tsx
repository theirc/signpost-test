import { Input, InputTextArea, Row, Select, useForm } from '@/components/forms'
import { createModel } from '@/lib/data/model'
import type { ApiWorker } from '@/lib/agents/workers/api'
import { NodeProps } from '@xyflow/react'
import { InlineHandles, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { MemoizedWorker } from '../memoizedworkers'
import { NodeLayout } from './node'
import { useEffect, useMemo, useState, useRef } from 'react'
import { JsonEditor } from 'json-edit-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Maximize2, X, FileJson, AlertCircle, Copy, Trash2, Globe } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { workerRegistry } from '@/lib/agents/registry'
import { ConditionHandler } from '../condition'
import { app } from '@/lib/app'

const { api } = workerRegistry
api.icon = Globe

// Define the options list inline
type MethodOption = { value: string, label: string };
const methodOptions: MethodOption[] = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
  { value: "PATCH", label: "PATCH" },
]

const authTypeOptions: MethodOption[] = [
  { value: "none", label: "None" },
  { value: "basic", label: "Basic Auth" },
  { value: "bearer", label: "Bearer Token" },
  { value: "api_key", label: "API Key" },
]

// Response viewer component that shows in a dialog
function ResponseViewer({ response }: { response: string }) {
  const [parsedResponse, setParsedResponse] = useState<any>(null);
  const [isValidJson, setIsValidJson] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse JSON response when it changes or dialog opens
  useEffect(() => {
    if (response) {
      try {
        const parsed = JSON.parse(response);
        setParsedResponse(parsed);
        setIsValidJson(true);
      } catch (e) {
        setIsValidJson(false);
      }
    } else {
      setParsedResponse(null);
      setIsValidJson(false);
    }
  }, [response, isOpen]);
  
  // Copy response to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(response).then(() => {
      // Could add a toast notification here
      console.log('Response copied to clipboard');
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 w-full"
          onClick={() => setIsOpen(true)}
        >
          {isValidJson ? <FileJson size={14} /> : <AlertCircle size={14} />}
          <span>View Response</span>
          <Maximize2 size={14} className="ml-auto" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              {isValidJson ? (
                <span className="flex items-center gap-2">
                  <FileJson size={16} className="text-green-600" /> 
                  <span>JSON Response</span>
                  <span className="text-xs font-normal text-green-600 ml-2">
                    Valid JSON
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <AlertCircle size={16} /> 
                  <span>Response</span>
                </span>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={copyToClipboard}
            >
              <Copy size={14} />
              <span>Copy</span>
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-auto bg-slate-50 rounded border">
          {isValidJson ? (
            <div className="p-4">
              <JsonEditor
                data={parsedResponse}
                setData={() => {}} 
                viewOnly={true}
                enableClipboard={true}
              />
            </div>
          ) : (
            <pre className="text-sm whitespace-pre-wrap p-4">{response}</pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const model = createModel({
  fields: {
    endpoint: { title: "Endpoint URL", type: "string" },
    method: { title: "Method", type: "string", list: methodOptions },
    params: { title: "Query Parameters (JSON)", type: "string" },
    headers: { title: "Additional Headers", type: "string" },
    timeout: { title: "Timeout (ms)", type: "number" },
    authType: { title: "Auth Type", type: "string", list: authTypeOptions },
    username: { title: "Username", type: "string" },
    selectedKeyName: { title: "Stored Key Name", type: "string" },
  }
})

function Parameters({ worker }: { worker: ApiWorker }) {
  const [authType, setAuthType] = useState(worker.parameters.authType || "none");

  // Get global API key names using the correct method
  const globalApiKeyNames = useMemo(() => Object.keys(app.getAPIkeys() || {}), []);
  const globalApiKeyOptions = useMemo(() => 
     globalApiKeyNames.map(name => ({ value: name, label: name })), 
     [globalApiKeyNames]
  );

  const { form, m, watch, setValue } = useForm(model, {
    values: {
      endpoint: worker.parameters.endpoint || '',
      method: worker.parameters.method || 'GET',
      params: worker.parameters.params || '{}',
      headers: worker.parameters.headers || '{}',
      timeout: worker.parameters.timeout || 10000,
      authType: worker.parameters.authType || 'none',
      username: worker.parameters.username || '',
      selectedKeyName: worker.parameters.selectedKeyName || '',
    }
  })

  // Update the list for the select dynamically
  if (m.selectedKeyName) {
     m.selectedKeyName.list = globalApiKeyOptions;
  } else {
     console.error("Form model field 'selectedKeyName' not found!");
  }

  watch((value, { name }) => {
    if (name === "endpoint") worker.parameters.endpoint = value.endpoint;
    if (name === "method") worker.parameters.method = value.method;
    if (name === "params") worker.parameters.params = value.params;
    if (name === "headers") worker.parameters.headers = value.headers;
    if (name === "timeout") worker.parameters.timeout = value.timeout;
    if (name === "authType") {
      const newAuthType = value.authType || 'none';
      setAuthType(newAuthType);
      worker.parameters.authType = newAuthType;
      // If switching away from an auth type that uses a key, clear selection
      if (authType !== 'none' && newAuthType === 'none') {
          setValue('selectedKeyName', '');
          worker.parameters.selectedKeyName = '';
      }
      // If switching TO an auth type that requires a key, clear selection (user must re-select)
      if (authType === 'none' && newAuthType !== 'none') {
          setValue('selectedKeyName', '');
          worker.parameters.selectedKeyName = '';
      }
    }
    if (name === "username") worker.parameters.username = value.username;
    if (name === "selectedKeyName") worker.parameters.selectedKeyName = value.selectedKeyName;
  })

  return (
    <form.context>
      <div className='p-2 -mt-2 nodrag w-full space-y-3'>
        <div> {/* Request Section */}
          <h3 className="font-semibold text-sm mb-2">Request Configuration</h3>
          <Row>
            <Input field={m.endpoint} span={8} placeholder="https://api.example.com/data" />
            <Select field={m.method} span={4} />
          </Row>
        </div>
        
        <div> {/* Authentication Section */}
          <h3 className="font-semibold text-sm mb-2">Authentication</h3>
          <Row>
            <Select field={m.authType} span={12} />
          </Row>
          
          {authType === 'basic' && (
            <>
              <Row>
                <Input field={m.username} span={12} placeholder="username or email" />
              </Row>
              <Row>
                <Select 
                   field={m.selectedKeyName} 
                   span={12} 
                   placeholder="Select Stored Key for Password..." 
                />
              </Row>
            </>
          )}
          
          {authType === 'bearer' && (
            <Row>
               <Select 
                  field={m.selectedKeyName} 
                  span={12} 
                  placeholder="Select Stored Key for Token..." 
               />
            </Row>
          )}
          
          {authType === 'api_key' && (
            <Row>
              <Select 
                 field={m.selectedKeyName} 
                 span={12} 
                 placeholder="Select Stored API Key..." 
              />
            </Row>
          )}
        </div>
        
        <div> {/* Parameters & Headers Section */}
          <h3 className="font-semibold text-sm mt-3 mb-2">Parameters & Headers Configuration</h3>
          <Row>
            <InputTextArea field={m.params} span={12} placeholder='{"key": "value"}' />
          </Row>
          <Row>
            <InputTextArea field={m.headers} span={12} placeholder='{"Content-Type": "application/json"}' />
          </Row>
        </div>
        
        <div> {/* Body Section */}
          <h3 className="font-semibold text-sm mt-3 mb-2">Runtime Body Input</h3>
           <p className="text-xs text-muted-foreground p-2 border rounded bg-slate-50">
              Connect another node to the 'Body' input handle on the left to provide a dynamic request body.
           </p>
        </div>
        
        <div> {/* Options Section */}
          <h3 className="font-semibold text-sm mt-3 mb-2">Options</h3>
          <Row>
            <Input field={m.timeout} type="number" span={12} min={1000} max={60000} step={1000} />
          </Row>
        </div>
      </div>
    </form.context>
  );
}

export function ApiNode(props: NodeProps) {
  const worker = useWorker<ApiWorker>(props.id)
  
  return (
    <NodeLayout worker={worker} resizable minHeight={500}>
      <div className='flex flex-col h-full'>
        <InlineHandles>
          <WorkerLabeledHandle handler={worker.fields.body} />
          <WorkerLabeledHandle handler={worker.fields.response} />
        </InlineHandles>
        
        <WorkerLabeledHandle handler={worker.fields.endpointUrlInput} />
        
        <WorkerLabeledHandle handler={worker.fields.error} />
        
        <MemoizedWorker worker={worker}>
          <Parameters worker={worker} />
        </MemoizedWorker>
        
        <ConditionHandler />
        
        {/* Response Preview */}
        {worker.fields.response.value && (
          <div className="mx-2 mt-2 border border-green-200 bg-green-50 rounded nodrag">
            <div className="text-xs font-semibold p-2 border-b border-green-200">
              <div className="flex items-center justify-between">
                <span>Response:</span>
                <span className="text-xs text-green-600">
                  {worker.fields.response.value.length} characters
                </span>
              </div>
            </div>
            <div className="p-2">
              <ResponseViewer response={worker.fields.response.value} />
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {worker.fields.error.value && (
          <div className="mx-2 mt-2 p-2 border border-red-200 bg-red-50 rounded overflow-auto nodrag" style={{ maxHeight: "150px" }}>
            <div className="text-xs font-semibold mb-1 text-red-700">Error:</div>
            <pre className="text-xs whitespace-pre-wrap text-red-600">{worker.fields.error.value}</pre>
          </div>
        )}
      </div>
    </NodeLayout>
  );
} 