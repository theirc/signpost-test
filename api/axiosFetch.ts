// This is the API proxy endpoint that sits between the frontend and the target API.
// It is used to handle the target API's response and error, and return a consistent response to the frontend.  

import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios, { AxiosRequestConfig, Method } from 'axios';

// Define the expected structure of the incoming request body
interface ProxyRequestBody {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

// Define the structure of the response sent back to the frontend
interface ProxyResponseData {
  status?: number;
  statusText?: string;
  data?: any;
  error?: string; // To report errors from the proxy itself or target API
  message?: string; // More detailed error message
}

export default async function handler(
  req: VercelRequest, 
  res: VercelResponse // Remove generic type here
) {
  // Only allow POST method for this proxy
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    // Type the json response here
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` } as ProxyResponseData);
  }

  // ... rest of the handler, ensuring .json calls are typed like above ...
  // e.g., res.status(200).json({ status: ..., data: ... } as ProxyResponseData);
  // e.g., res.status(500).json({ error: ..., message: ... } as ProxyResponseData);

  const {
    url,
    method = 'GET', 
    headers = {},   
    params = {},
    data = null,    
    timeout = 10000 
  }: ProxyRequestBody = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing target URL in request body' } as ProxyResponseData);
  }

  // ... logging ...

  try {
    const config: AxiosRequestConfig = {
      url: url,
      method: method as Method,
      headers: headers,
      params: params,
      data: data,
      timeout: timeout,
      validateStatus: function (status) {
        return status >= 100 && status < 600;
      },
    };

    console.log('[axiosFetch Proxy] Axios config before sending:', JSON.stringify(config, null, 2));

    console.log('[axiosFetch Proxy] Sending request to target API...');
    const targetResponse = await axios(config);
    console.log(`[axiosFetch Proxy] Target API responded with status: ${targetResponse.status}`);

    return res.status(200).json({ 
      status: targetResponse.status,
      statusText: targetResponse.statusText,
      data: targetResponse.data,
    } as ProxyResponseData);

  } catch (error: any) {
    // ... error logging ...
    return res.status(500).json({ 
      error: 'Proxy execution failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred in proxy.',
      targetUrl: url,
    } as ProxyResponseData);
  }
}
