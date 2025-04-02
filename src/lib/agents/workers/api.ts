import { Globe } from "lucide-react"
import axios from 'axios'

declare global {
  interface ApiWorker extends AIWorker {
    fields: {
      endpoint: NodeIO
      params: NodeIO
      headers: NodeIO
      method: NodeIO
      body: NodeIO
      response: NodeIO
      error: NodeIO
      // Auth fields
      authType: NodeIO
      username: NodeIO
      password: NodeIO
      apiKeyName: NodeIO
      apiKeyValue: NodeIO
    }
    parameters: {
      timeout?: number
      retries?: number
    }
  }
}

function create(agent: Agent) {
  return agent.initializeWorker(
    { type: "api" },
    [
      { type: "string", direction: "input", title: "Endpoint", name: "endpoint", persistent: true },
      { type: "string", direction: "input", title: "Params", name: "params", persistent: true },
      { type: "string", direction: "input", title: "Headers", name: "headers", persistent: true },
      { type: "string", direction: "input", title: "Method", name: "method", persistent: true },
      { type: "string", direction: "input", title: "Body", name: "body" },
      { type: "string", direction: "output", title: "Response", name: "response" },
      { type: "string", direction: "output", title: "Error", name: "error" },
      // Auth fields
      { type: "string", direction: "input", title: "Auth Type", name: "authType", persistent: true },
      { type: "string", direction: "input", title: "Username", name: "username", persistent: true },
      { type: "string", direction: "input", title: "Password/Token", name: "password", persistent: true },
      { type: "string", direction: "input", title: "API Key Name", name: "apiKeyName", persistent: true },
      { type: "string", direction: "input", title: "API Key Value", name: "apiKeyValue", persistent: true },
    ],
    api
  )
}

async function execute(worker: ApiWorker) {
  try {
    // Get base endpoint
    const endpoint = worker.fields.endpoint.value || '';
    if (!endpoint) {
      throw new Error("API endpoint is required");
    }

    // Parse parameters if provided
    let params = {};
    const paramsInput = worker.fields.params.value;
    if (paramsInput) {
      try {
        params = typeof paramsInput === 'string' ? JSON.parse(paramsInput) : paramsInput;
      } catch (err) {
        console.error("Failed to parse params as JSON:", err);
        throw new Error("Invalid params format. Must be JSON object.");
      }
    }

    // Parse headers if provided
    let headers: Record<string, string> = {};
    const headerInput = worker.fields.headers.value;
    if (headerInput) {
      try {
        headers = typeof headerInput === 'string' ? JSON.parse(headerInput) : headerInput;
      } catch (err) {
        console.error("Failed to parse headers as JSON:", err);
        throw new Error("Invalid headers format. Must be JSON object.");
      }
    }

    // === Start: Add Authentication Headers ===
    const authType = worker.fields.authType.value;
    const username = worker.fields.username.value;
    const password = worker.fields.password.value;
    const apiKeyName = worker.fields.apiKeyName.value || 'X-API-Key'; // Default if not set
    const apiKeyValue = worker.fields.apiKeyValue.value;

    // Remove potentially pre-existing auth headers from the user-defined headers
    // This prevents conflicts if the user accidentally included them
    delete headers['Authorization']; 
    // Attempt to remove any header that might be the API key name (case-insensitive)
    Object.keys(headers).forEach(key => {
      if (key.toLowerCase() === apiKeyName.toLowerCase()) {
        delete headers[key];
      }
    });

    switch (authType) {
      case 'basic':
        if (username && password) {
          // Use Buffer for btoa in Node.js environment if available, otherwise fallback
          const token = typeof Buffer !== 'undefined' 
            ? Buffer.from(`${username}:${password}`).toString('base64') 
            : btoa(`${username}:${password}`);
          headers.Authorization = `Basic ${token}`;
        }
        break;
      case 'bearer':
        if (password) { // Using password field for token
          headers.Authorization = `Bearer ${password}`;
        }
        break;
      case 'api_key':
        if (apiKeyName && apiKeyValue) {
          headers[apiKeyName] = apiKeyValue;
        }
        break;
      // 'none' or unknown type: do nothing
    }
    // === End: Add Authentication Headers ===

    // Get request method
    const method = (worker.fields.method.value || 'GET').toUpperCase();

    // Parse request body if provided
    let data = undefined;
    if (method !== 'GET' && worker.fields.body.value) {
      try {
        const bodyData = worker.fields.body.value;
        if (typeof bodyData === 'string') {
          // Try to parse as JSON if it looks like JSON, otherwise use as is
          if (bodyData.trim().startsWith('{') || bodyData.trim().startsWith('[')) {
            try {
              data = JSON.parse(bodyData);
            } catch (e) {
              data = bodyData;
            }
          } else {
            data = bodyData;
          }
        } else {
          data = bodyData;
        }
        
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      } catch (err) {
        console.error("Failed to process body:", err);
      }
    }

    // Set up request config
    const timeout = worker.parameters.timeout || 10000; // 10 second default timeout
    
    console.log(`Making ${method} request to ${endpoint}`);
    
    // Use the backend proxy route instead of direct API calls
    const proxyResponse = await axios({
      method: 'POST',
      url: '/api/axiosFetch',
      data: {
        url: endpoint,
        method: method,
        headers: headers,
        params: params,
        data: data,
        timeout: timeout
      }
    });
    
    // Clear any previous errors
    worker.fields.error.value = '';

    // Handle proxy response
    if (proxyResponse.status === 200) {
      const apiResponse = proxyResponse.data;
      
      // Check the status code from the proxied API response
      if (apiResponse.status >= 200 && apiResponse.status < 300) {
        // Successful response
        if (apiResponse.data) {
          if (typeof apiResponse.data === 'object') {
            worker.fields.response.value = JSON.stringify(apiResponse.data, null, 2);
          } else {
            worker.fields.response.value = String(apiResponse.data);
          }
        } else {
          worker.fields.response.value = `Request successful: ${apiResponse.status} ${apiResponse.statusText}`;
        }
      } else {
        // Non-2xx response from the target API
        const errorMsg = `Error ${apiResponse.status} ${apiResponse.statusText}`;
        worker.fields.error.value = apiResponse.data 
          ? `${errorMsg}: ${typeof apiResponse.data === 'object' ? JSON.stringify(apiResponse.data, null, 2) : apiResponse.data}`
          : errorMsg;
        worker.fields.response.value = '';
      }
    } else {
      // Error from our proxy service
      throw new Error(`Proxy service error: ${proxyResponse.status} ${proxyResponse.statusText}`);
    }

  } catch (error) {
    console.error("API worker error:", error);
    
    // Clear response on error
    worker.fields.response.value = '';
    
    // Set error output with detailed information
    if (axios.isAxiosError(error)) {
      const axiosError = error;
      
      if (axiosError.response) {
        // Error response from our proxy
        const errorData = axiosError.response.data;
        
        if (errorData.error) {
          worker.fields.error.value = `${errorData.error}: ${errorData.message || ''}`;
        } else if (errorData.status) {
          // This is a forwarded error from the target API
          worker.fields.error.value = `Error ${errorData.status} ${errorData.statusText || ''}: ${
            typeof errorData.data === 'object' ? JSON.stringify(errorData.data, null, 2) : (errorData.data || '')
          }`;
        } else {
          worker.fields.error.value = `Request failed: ${axiosError.message}`;
        }
      } else if (axiosError.request) {
        // Request was made but no response received
        worker.fields.error.value = "No response received from server. Check your network connection.";
      } else {
        // Error setting up the request
        worker.fields.error.value = axiosError.message || "Unknown error occurred while setting up the request";
      }
    } else {
      worker.fields.error.value = error instanceof Error ? error.message : String(error);
    }
  }
}

export const api: WorkerRegistryItem = {
  title: "API Call",
  icon: Globe,
  execute,
  create,
  get registry() { return api },
}