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
                 // If the selected key is missing, throw an error.
                throw new Error(`Selected stored key named "${selectedKeyName}" was not found in the globally provided API keys.`);
            } else {
                // This case means auth was selected, but no key name was chosen in params
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

    console.log(`API Worker (${worker.id}) - Making direct ${method} request to: ${endpoint}`);

    // --- Log request details before sending ---
    console.log(`API Worker (${worker.id}) - Request Details Before Sending:`,
        `\n  URL: ${endpoint}`,
        `\n  Method: ${method}`,
        `\n  Headers: ${JSON.stringify(headers)}`,
        `\n  Params: ${JSON.stringify(params)}`,
        `\n  Body: ${typeof data === 'object' ? JSON.stringify(data) : data}`
    );
    // --- End logging request details ---

    // --- Make the direct API call using axios ---
    const response = await axios({
        method: method as any, // Cast needed as axios types might be stricter
        url: endpoint,
        headers: headers,
        params: params,
        data: data,
        timeout: timeout,
        // Ensure Axios doesn't throw for non-2xx status codes, so we can handle them manually
        validateStatus: function (status) {
            return status >= 200 && status < 500; // Accept 2xx, 3xx, 4xx - handle 5xx as errors later
        },
    });

    // --- Handle the direct response ---
    worker.fields.error.value = ''; // Clear previous error

    if (response.status >= 200 && response.status < 300) {
      // Successful response from target API
       console.log(`API Worker (${worker.id}) - Success Response Status: ${response.status}`);
       if (response.data !== undefined && response.data !== null) {
         if (typeof response.data === 'object') {
           worker.fields.response.value = JSON.stringify(response.data, null, 2);
         } else {
           worker.fields.response.value = String(response.data);
         }
       } else {
         worker.fields.response.value = `Request successful: ${response.status} ${response.statusText || ''}`;
       }
    } else {
      // Non-2xx response from target API (e.g., 4xx client errors, potentially 3xx redirects if not followed)
      console.warn(`API Worker (${worker.id}) - Non-Success Response Status: ${response.status}`);
      const errorStatus = response.status || 'Unknown';
      const errorStatusText = response.statusText || 'Error';
      const errorMsg = `Request failed with status code ${errorStatus} (${errorStatusText})`;
      let errorDataString = '';
      if (response.data) {
          try {
              errorDataString = typeof response.data === 'object' ? JSON.stringify(response.data) : String(response.data);
          } catch (e) { errorDataString = '[Could not stringify error data]'; }
      }

      // --- Added detailed logging for non-success response ---
      console.error(`API Worker (${worker.id}) - Request Details for Failed Call:`,
          `\n  URL: ${endpoint}`,
          `\n  Method: ${method}`,
          `\n  Headers: ${JSON.stringify(headers)}`, // Headers used in the axios call
          `\n  Params: ${JSON.stringify(params)}`,
          `\n  Body: ${typeof data === 'object' ? JSON.stringify(data) : data}`,
          `\n  Response Status: ${response.status}`,
          `\n  Response Status Text: ${response.statusText}`,
          `\n  Response Data: ${errorDataString}`
      );
      // --- End detailed logging ---

      worker.fields.error.value = errorDataString ? `${errorMsg} (Response Data: ${errorDataString})` : errorMsg;
      worker.fields.response.value = '';
    }
    // Note: The catch block below will handle axios errors like timeouts, network errors, or 5xx server errors if validateStatus was stricter

  } catch (error) {
     console.error("API worker error:", worker.id, error); // Simplified log prefix
     worker.fields.response.value = '';
     let errorMessage = "An unknown error occurred.";
     if (axios.isAxiosError(error)) {
         errorMessage = error.message; // Default axios error message
         if (error.response) {
             // This block now primarily handles errors not caught by validateStatus (e.g., 5xx) or if validateStatus is changed
             errorMessage = `Request failed with status code ${error.response.status} (${error.response.statusText || 'Error'})`;
             if (error.response.data) {
                 try {
                     const errorDataString = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : String(error.response.data);
                     errorMessage = `${errorMessage} (Response Data: ${errorDataString})`;
                 } catch (e) { /* Ignore stringify error */ }
             }
         } else if (error.request) {
             // Error occurred setting up the request or no response received (e.g., timeout, network error)
             errorMessage = `No response received or request setup failed: ${error.message}`;
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
  description: "This worker allows you to make external API calls to use other external services.", // Updated description
  execute,
  create,
  get registry() { return api },
}