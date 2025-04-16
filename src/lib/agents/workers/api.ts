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

async function execute(worker: ApiWorker, p: AgentParameters) {
  try {
    // --- Common Setup --- 
    const runtimeEndpoint = worker.fields.endpointUrlInput?.value as string | undefined;
    const fallbackEndpoint = worker.parameters.endpoint || '';
    const endpoint = runtimeEndpoint && runtimeEndpoint.trim() !== '' ? runtimeEndpoint.trim() : fallbackEndpoint;

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
    const bodyValue = worker.fields.body.value;

    let params = {};
    try { params = JSON.parse(paramsString); } catch (e) { throw new Error("Invalid params JSON in parameters."); }
    let headers: Record<string, string> = {};
    try { headers = JSON.parse(headersString); } catch (e) { throw new Error("Invalid headers JSON in parameters."); }

    delete headers['Authorization']; 
    delete headers['X-API-Key'];
    Object.keys(headers).forEach(key => {
      if (key.toLowerCase() === 'x-api-key' || key.toLowerCase() === 'authorization') delete headers[key];
    });

    let actualValue: string | undefined;
    if (authType !== 'none' && authType) {
      if (!selectedKeyName) { throw new Error(`Auth type '${authType}' selected, but no Stored Key Name chosen.`); }
      actualValue = p.apikeys?.[selectedKeyName]; 
      if (actualValue === undefined) { 
        if (selectedKeyName) { throw new Error(`Selected stored key "${selectedKeyName}" not found in provided API keys.`); }
        else { throw new Error(`Auth type '${authType}' selected, but no Stored Key Name chosen.`); }
      }
    }

    switch (authType) {
      case 'basic':
        if (!username) throw new Error("Username required for Basic Auth.");
        if (actualValue !== undefined) { headers.Authorization = `Basic ${btoa(`${username}:${actualValue}`)}`; }
        break;
      case 'bearer':
        if (actualValue !== undefined) { headers.Authorization = `Bearer ${actualValue}`; }
        break;
      case 'api_key':
        if (actualValue !== undefined) { headers['X-API-Key'] = actualValue; }
        break;
    }

    let data = undefined;
    if (method !== 'GET' && bodyValue) {
      data = bodyValue;
      if (!headers['Content-Type'] && typeof data === 'string' && (data.trim().startsWith('{') || data.trim().startsWith('['))) {
        headers['Content-Type'] = 'application/json';
      }
    }
    // --- End Common Setup ---

    // --- Environment Check and Call --- 
    const isBrowser = typeof window !== 'undefined';
    let apiResponseData: any;
    let apiResponseStatus: number | undefined;
    let apiResponseStatusText: string | undefined;

    if (isBrowser) {
      // FRONTEND: Use the proxy
      console.log(`API Worker (${worker.id}) [Browser] - Using proxy /api/axiosFetch for: ${endpoint}`);
      const proxyResponse = await axios({
        method: 'POST',
        url: '/api/axiosFetch', 
        data: { url: endpoint, method, headers, params, data, timeout }
      });

      if (proxyResponse.status !== 200) {
         throw new Error(`Proxy service request failed: ${proxyResponse.status} ${proxyResponse.statusText}`);
      }
      // Assuming proxy returns { status, statusText, data, error? }
      const proxyResult = proxyResponse.data;
      if (proxyResult?.error) {
          throw new Error(`Proxy error: ${proxyResult.error} ${proxyResult.message || ''}`);
      }
      apiResponseData = proxyResult?.data;
      apiResponseStatus = proxyResult?.status;
      apiResponseStatusText = proxyResult?.statusText;

    } else {
      // BACKEND: Make direct call
      console.log(`API Worker (${worker.id}) [Node.js] - Making direct ${method} request to: ${endpoint}`);
      const directResponse = await axios({
          method: method as any, 
          url: endpoint,
          headers: headers,
          params: params,
          data: data,
          timeout: timeout,
          validateStatus: (status) => status >= 200 && status < 500, // Handle 4xx locally
      });
      apiResponseData = directResponse.data;
      apiResponseStatus = directResponse.status;
      apiResponseStatusText = directResponse.statusText;
    }
    // --- End Environment Check and Call --- 

    // --- Common Response Handling --- 
    worker.fields.error.value = ''; // Clear previous error

    if (apiResponseStatus && apiResponseStatus >= 200 && apiResponseStatus < 300) {
      // Success (2xx)
      console.log(`API Worker (${worker.id}) - Success Response Status: ${apiResponseStatus}`);
      if (apiResponseData !== undefined && apiResponseData !== null) {
        worker.fields.response.value = typeof apiResponseData === 'object' 
            ? JSON.stringify(apiResponseData, null, 2) 
            : String(apiResponseData);
      } else {
        worker.fields.response.value = `Request successful: ${apiResponseStatus} ${apiResponseStatusText || ''}`;
      }
    } else {
      // Non-Success (3xx, 4xx, or error from proxy)
      const errorStatus = apiResponseStatus || 'Unknown';
      const errorStatusText = apiResponseStatusText || 'Error';
      const errorMsg = `Request failed with status code ${errorStatus} (${errorStatusText})`;
      let errorDataString = '';
      if (apiResponseData) {
          try {
              errorDataString = typeof apiResponseData === 'object' ? JSON.stringify(apiResponseData) : String(apiResponseData);
          } catch (e) { errorDataString = '[Could not stringify error data]'; }
      }
      console.warn(`API Worker (${worker.id}) - Non-Success Response Status: ${errorStatus}. Data: ${errorDataString}`);
      worker.fields.error.value = errorDataString ? `${errorMsg} (Response Data: ${errorDataString})` : errorMsg;
      worker.fields.response.value = '';
    }
    // --- End Common Response Handling ---

  } catch (error) {
    // --- Common Error Handling (Network errors, 5xx, setup errors, proxy errors) ---
    console.error("API worker error:", worker.id, error); 
    worker.fields.response.value = '';
    let errorMessage = "An unknown error occurred.";
    if (axios.isAxiosError(error)) {
        errorMessage = error.message; 
        if (error.response) {
            // Error with a response (e.g., 5xx from direct call, or maybe proxy itself failed)
            errorMessage = `Request failed with status code ${error.response.status} (${error.response.statusText || 'Error'})`;
            if (error.response.data) {
                try { errorMessage += ` (Response Data: ${typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : String(error.response.data)})`; }
                catch (e) { /* ignore stringify error */ }
            }
        } else if (error.request) {
            // No response received or setup failed
            errorMessage = `No response received or request setup failed: ${error.message}`;
        }
    } else if (error instanceof Error) { 
        errorMessage = error.message; 
    } else { 
        try { errorMessage = JSON.stringify(error); } catch (e) { errorMessage = String(error); } 
    }
    worker.fields.error.value = errorMessage;
    // --- End Common Error Handling ---
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