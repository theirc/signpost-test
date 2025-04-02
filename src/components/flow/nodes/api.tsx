import { Input, InputTextArea, Row, Select, useForm } from '@/components/forms'
import { workerRegistry } from '@/lib/agents/registry'
import { createModel } from '@/lib/data/model'
import { NodeProps } from '@xyflow/react'
import { InlineHandles, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { MemoizedWorker } from '../memoizedworkers'
import { NodeLayout } from './node'
import { useEffect, useState } from 'react'
import { JsonEditor } from 'json-edit-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Maximize2, X, FileJson, AlertCircle, Copy } from 'lucide-react'
const { api } = workerRegistry

// Icon is already set in the worker file

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
    body: { title: "Request Body", type: "string" },
    timeout: { title: "Timeout (ms)", type: "number" },
    // Auth fields
    authType: { title: "Auth Type", type: "string", list: authTypeOptions },
    username: { title: "Username", type: "string" },
    password: { title: "Password/Token", type: "string" },
    apiKeyName: { title: "Key Name", type: "string" },
    apiKeyValue: { title: "Key Value", type: "string" },
  }
})

function Parameters({ worker }: { worker: ApiWorker }) {
  // Initialize authType state from worker field, default to 'none'
  const [authType, setAuthType] = useState(worker.fields.authType.value || "none");
  
  // Parse existing auth from headers - REMOVED
  // useEffect(() => { ... }, [worker.fields.headers.value]); // REMOVED

  const { form, m, watch } = useForm(model, {
    values: {
      endpoint: worker.fields.endpoint.value || '',
      method: worker.fields.method.value || 'GET',
      params: worker.fields.params.value || '',
      headers: worker.fields.headers.value || '',
      body: worker.fields.body.value || '',
      timeout: worker.parameters.timeout || 10000,
      // Initialize auth fields from worker state
      authType: worker.fields.authType.value || 'none',
      username: worker.fields.username.value || '',
      password: worker.fields.password.value || '',
      apiKeyName: worker.fields.apiKeyName.value || 'X-API-Key',
      apiKeyValue: worker.fields.apiKeyValue.value || '',
    }
  })

  watch((value, { name }) => {
    if (name === "endpoint") worker.fields.endpoint.value = value.endpoint
    if (name === "method") worker.fields.method.value = value.method
    if (name === "params") worker.fields.params.value = value.params
    if (name === "headers") worker.fields.headers.value = value.headers
    if (name === "body") worker.fields.body.value = value.body
    if (name === "timeout") worker.parameters.timeout = value.timeout
    
    // Handle auth changes
    if (name === "authType") {
      setAuthType(value.authType);
      worker.fields.authType.value = value.authType; // Store authType directly
    }
    
    // Update auth fields directly in worker state
    if (name === "username") worker.fields.username.value = value.username;
    if (name === "password") worker.fields.password.value = value.password;
    if (name === "apiKeyName") worker.fields.apiKeyName.value = value.apiKeyName;
    if (name === "apiKeyValue") worker.fields.apiKeyValue.value = value.apiKeyValue;
  })
  
  // Function to update auth headers based on auth type and fields - REMOVED
  // const updateAuthHeaders = (values: any) => { ... }; // REMOVED

  return (
    <form.context>
      <div className='p-2 -mt-2 nodrag w-full'>
        <h3 className="font-semibold text-sm mb-2">Request</h3>
        <Row>
          <Input field={m.endpoint} span={8} placeholder="https://api.example.com/data" />
          <Select field={m.method} span={4} />
        </Row>
        
        <h3 className="font-semibold text-sm mt-3 mb-2">Authentication</h3>
        <Row>
          <Select field={m.authType} span={12} />
        </Row>
        
        {authType === 'basic' && (
          <>
            <Row>
              <Input field={m.username} span={12} placeholder="username or email" />
            </Row>
            <Row>
              <Input field={m.password} span={12} placeholder="password" type="password" />
            </Row>
          </>
        )}
        
        {authType === 'bearer' && (
          <Row>
            <Input field={m.password} span={12} placeholder="token" />
          </Row>
        )}
        
        {authType === 'api_key' && (
          <>
            <Row>
              <Input field={m.apiKeyName} span={12} placeholder="X-API-Key" />
            </Row>
            <Row>
              <Input field={m.apiKeyValue} span={12} placeholder="your_api_key_here" />
            </Row>
          </>
        )}
        
        <h3 className="font-semibold text-sm mt-3 mb-2">Parameters & Headers</h3>
        <Row>
          <InputTextArea field={m.params} span={12} placeholder='{"key": "value"}' />
        </Row>
        <Row>
          <InputTextArea field={m.headers} span={12} placeholder='{"Content-Type": "application/json"}' />
        </Row>
        
        <h3 className="font-semibold text-sm mt-3 mb-2">Body</h3>
        <Row>
          <InputTextArea field={m.body} span={12} placeholder="Request body (for POST/PUT)" />
        </Row>
        
        <h3 className="font-semibold text-sm mt-3 mb-2">Options</h3>
        <Row>
          <Input field={m.timeout} type="number" span={12} min={1000} max={60000} step={1000} />
        </Row>
      </div>
    </form.context>
  );
}

export function ApiNode(props: NodeProps) {
  const worker = useWorker<ApiWorker>(props.id)
  
  return (
    <NodeLayout worker={worker} resizable minHeight={400}>
      <div className='flex flex-col h-full'>
        <InlineHandles>
          <WorkerLabeledHandle handler={worker.fields.body} />
          <WorkerLabeledHandle handler={worker.fields.response} />
        </InlineHandles>
        
        <WorkerLabeledHandle handler={worker.fields.error} />
        <WorkerLabeledHandle handler={worker.fields.endpoint} />
        <WorkerLabeledHandle handler={worker.fields.params} />
        <WorkerLabeledHandle handler={worker.fields.headers} />
        <WorkerLabeledHandle handler={worker.fields.method} />
        
        <MemoizedWorker worker={worker}>
          <Parameters worker={worker} />
        </MemoizedWorker>
        
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