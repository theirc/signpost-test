import { Globe } from "lucide-react"
import axios from 'axios'

export interface ApiWorker extends AIWorker {
  fields: {
    body: NodeIO
    response: NodeIO
    error: NodeIO
    condition: NodeIO // Ensure condition field exists if using ConditionHandler
    endpointUrlInput: NodeIO // Added new input field handle
  }
  parameters: {
    endpoint?: string // This is the fallback endpoint
    method?: string
    params?: string
    headers?: string
    timeout?: number
    authType?: string
    username?: string
    selectedKeyName?: string // Keep this to select WHICH global key to use
    // localApiKeys?: { [keyName: string]: string } // REMOVED insecure local key storage
  }
}

function create(agent: Agent) {
  const worker = agent.initializeWorker(
    { 
      type: "api",
      parameters: { 
          // REMOVED localApiKeys: {}, 
          endpoint: '', 
          method: 'GET', 
          params: '{}', 
          headers: '{}', 
          timeout: 10000, 
          authType: 'none', 
          username: '', 
          selectedKeyName: '' 
      } 
    },
    [
      { type: "string", direction: "input", title: "Body", name: "body" },
      { type: "string", direction: "output", title: "Response", name: "response" },
      { type: "string", direction: "output", title: "Error", name: "error" },
      { type: "unknown", direction: "input", title: "Condition", name: "condition", condition: true },
      { type: "string", direction: "input", title: "Endpoint URL", name: "endpointUrlInput" }, // Added handle definition
    ],
    api
  );
  return worker;
}

async function execute(worker: ApiWorker, p: AgentParameters) { // Added p: AgentParameters
  try {
    // Get endpoint: prioritize input handle, fallback to parameter
    const runtimeEndpoint = worker.fields.endpointUrlInput?.value as string | undefined;
    const fallbackEndpoint = worker.parameters.endpoint || '';
    const endpoint = runtimeEndpoint && runtimeEndpoint.trim() !== '' ? runtimeEndpoint.trim() : fallbackEndpoint;

    // Validation: Ensure an endpoint is available
    if (!endpoint) {
      throw new Error("API endpoint is required. Provide it either via the 'Endpoint URL' input handle or in the node parameters.");
    }
    
    const method = (worker.parameters.method || 'GET').toUpperCase();
    const paramsString = worker.parameters.params || '{}';
    const headersString = worker.parameters.headers || '{}';
    const timeout = worker.parameters.timeout || 10000;
    const authType = worker.parameters.authType || 'none';
    const username = worker.parameters.username;
    const selectedKeyName = worker.parameters.selectedKeyName || '';
    // REMOVED localKeys = worker.parameters.localApiKeys || {};
    
    const bodyValue = worker.fields.body.value;

    let params = {};
    try { params = JSON.parse(paramsString); } catch (e) { throw new Error("Invalid params JSON in parameters."); }

    let headers: Record<string, string> = {};
    try { headers = JSON.parse(headersString); } catch (e) { throw new Error("Invalid headers JSON in parameters."); }

    // Clean potentially sensitive headers before adding auth
    delete headers['Authorization']; 
    delete headers['X-API-Key'];
    Object.keys(headers).forEach(key => {
      if (key.toLowerCase() === 'x-api-key' || key.toLowerCase() === 'authorization') delete headers[key];
    });

    let actualValue: string | undefined;
    if (authType !== 'none' && authType) {
        if (!selectedKeyName) {
             throw new Error(`Auth type '${authType}' selected, but no Stored Key Name chosen in parameters.`);
        }
        // Get key value from GLOBAL AgentParameters (passed during execution)
        actualValue = p.apikeys?.[selectedKeyName]; 
        if (actualValue === undefined) { 
            // Distinguish between key name selected but not found globally vs. no key selected
            if (selectedKeyName) {
                throw new Error(`Selected stored key named "${selectedKeyName}" was not found in the globally provided API keys.`);
            } else {
                // This case is already handled by the check above, but included for clarity
                throw new Error(`Auth type '${authType}' selected, but no Stored Key Name chosen in parameters.`);
            }
        }
    }

    switch (authType) {
      case 'basic':
        console.log(`API Worker (${worker.id}) - Entered 'basic' auth case.`); // DEBUG
        if (!username) throw new Error("Username is required for Basic Auth (in parameters).");
        if (actualValue !== undefined) {
          const token = typeof Buffer !== 'undefined' 
            ? Buffer.from(`${username}:${actualValue}`).toString('base64') 
            : btoa(`${username}:${actualValue}`);
          headers.Authorization = `Basic ${token}`;
          console.log(`API Worker (${worker.id}) - Added Basic Auth header:`, headers.Authorization); // DEBUG
          console.log(`API Worker (${worker.id}) - Headers object after add:`, JSON.stringify(headers)); // DEBUG
        } else {
           console.warn(`API Worker (${worker.id}) - Basic auth failed: actualValue was undefined (key '${selectedKeyName}' likely missing).`); // DEBUG
        }
        break;
      case 'bearer':
         console.log(`API Worker (${worker.id}) - Entered 'bearer' auth case.`); // DEBUG
        if (actualValue !== undefined) {
          headers.Authorization = `Bearer ${actualValue}`;
          console.log(`API Worker (${worker.id}) - Added Bearer Auth header:`, headers.Authorization); // DEBUG
          console.log(`API Worker (${worker.id}) - Headers object after add:`, JSON.stringify(headers)); // DEBUG
        } else {
            console.warn(`API Worker (${worker.id}) - Bearer auth failed: actualValue was undefined (key '${selectedKeyName}' likely missing).`); // DEBUG
        }
        break;
      case 'api_key':
         console.log(`API Worker (${worker.id}) - Entered 'api_key' auth case.`); // DEBUG
        if (actualValue !== undefined) {
          const headerName = 'X-API-Key'; // Consider making this configurable?
          headers[headerName] = actualValue; 
          console.log(`API Worker (${worker.id}) - Added API Key header '${headerName}':`, headers[headerName]); // DEBUG
          console.log(`API Worker (${worker.id}) - Headers object after add:`, JSON.stringify(headers)); // DEBUG
        } else {
             console.warn(`API Worker (${worker.id}) - API Key auth failed: actualValue was undefined (key '${selectedKeyName}' likely missing).`); // DEBUG
        }
        break;
      default:
         console.log(`API Worker (${worker.id}) - Entered default auth case (authType: ${authType}). No auth header added.`); // DEBUG
    }
    // === End Authentication ===

    let data = undefined;
    // Use runtime body value from fields
    if (method !== 'GET' && bodyValue) {
        // Assume bodyValue is string or already object/primitive
        data = bodyValue;
        // Auto-add Content-Type if not present and body looks like JSON
        if (!headers['Content-Type'] && typeof data === 'string' && (data.trim().startsWith('{') || data.trim().startsWith('['))) {
             headers['Content-Type'] = 'application/json';
        }
    }

    console.log(`API Worker (${worker.id}) - State before axios call:`, { /* ... log object ... */ });
 
     // --- Call the backend proxy instead --- 
    console.log(`Making ${method} request via /api/axiosFetch for endpoint: ${endpoint}`);
    const proxyResponse = await axios({
      method: 'POST', // Proxy endpoint expects POST
      url: '/api/axiosFetch', // Your backend proxy endpoint
      data: { // Send target request details in the payload
        url: endpoint,
        method: method,
        headers: headers, // Send calculated headers
        params: params,
        data: data, 
        timeout: timeout
      }
    });

    // Handle response FROM THE PROXY
    worker.fields.error.value = '';
    // Check status of the PROXY response itself first
    if (proxyResponse.status === 200) {
        // Now check the data returned BY the proxy, which should contain 
        // the status and data from the ACTUAL target API call made by the proxy.
        const apiResult = proxyResponse.data; 

        // Assuming proxy returns structure like { status: number, statusText: string, data: any, error?: string }
        // Adjust based on your actual proxy response structure!
        if (apiResult?.error) { // Check if the proxy reported an error during its execution
            throw new Error(`Proxy error: ${apiResult.error}`);
        }
        
        if (apiResult && apiResult.status >= 200 && apiResult.status < 300) {
          // Successful response from target API (via proxy)
          if (apiResult.data !== undefined && apiResult.data !== null) { // Check if data exists
            if (typeof apiResult.data === 'object') {
              worker.fields.response.value = JSON.stringify(apiResult.data, null, 2);
            } else {
              worker.fields.response.value = String(apiResult.data);
            }
          } else {
            worker.fields.response.value = `Request successful: ${apiResult.status} ${apiResult.statusText || ''}`;
          }
        } else {
          // Non-2xx response from target API (via proxy)
          const errorStatus = apiResult?.status || 'Unknown';
          const errorStatusText = apiResult?.statusText || 'Error';
          const errorMsg = `Request failed with status code ${errorStatus} (${errorStatusText})`;
          let errorDataString = '';
          if (apiResult?.data) {
              try {
                  errorDataString = typeof apiResult.data === 'object' ? JSON.stringify(apiResult.data) : String(apiResult.data);
              } catch (e) { errorDataString = '[Could not stringify error data]'; }
          }
          worker.fields.error.value = errorDataString ? `${errorMsg} (Response Data: ${errorDataString})` : errorMsg;
          worker.fields.response.value = '';
        }
    } else {
      // Error FROM the proxy service itself (e.g., proxy 500 error, network error talking to proxy)
      throw new Error(`Proxy service request failed: ${proxyResponse.status} ${proxyResponse.statusText}`);
    }

  } catch (error) {
     console.error("API worker error (or error communicating with proxy):", worker.id, error);
     worker.fields.response.value = '';
     let errorMessage = "An unknown error occurred.";
     if (axios.isAxiosError(error)) {
         errorMessage = error.message;
         if (error.response) {
             errorMessage = `Request failed with status code ${error.response.status} (${error.response.statusText || 'Error'})`;
             if (error.response.data) {
                 try {
                     const errorDataString = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : String(error.response.data);
                     errorMessage = `${errorMessage} (Response Data: ${errorDataString})`;
                 } catch (e) { /* Ignore stringify error */ }
             }
         } else if (error.request) {
             errorMessage = "No response received from server. Check network or target API status.";
         }
     } else if (error instanceof Error) { 
         errorMessage = error.message; 
     } else { 
         try { errorMessage = JSON.stringify(error); } catch (e) { errorMessage = String(error); } 
     }
     worker.fields.error.value = errorMessage;
  }
}

export const api: WorkerRegistryItem = {
  title: "API Call",
  type: "api",
  category: "tool",
  description: "This worker allows you to make external API calls using globally stored keys.", // Updated description
  execute,
  create,
  get registry() { return api },
}