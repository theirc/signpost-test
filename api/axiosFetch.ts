/**
 * API Proxy Service
 * 
 * This API endpoint acts as a proxy for external API calls from the API worker.
 * It forwards requests made from the frontend to external APIs, avoiding CORS issues.
 * 
 * @route POST /api/axiosFetch
 * @param {Object} request - Request details including URL, method, headers, params, and body
 * @returns {Object} Response from the external API
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Maximum timeout for requests
const MAX_TIMEOUT = 60000;
const DEFAULT_TIMEOUT = 10000;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  // Only allow POST requests for security
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    // Get request parameters from the request body
    const {
      url,
      method = 'GET',
      headers = {},
      params = {},
      data = null,
      timeout = DEFAULT_TIMEOUT
    } = request.body;

    // Validate required parameters
    if (!url) {
      response.status(400).json({ error: 'Missing required parameter: url' });
      return;
    }

    // Set security headers for response
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Log the request (without sensitive data)
    console.log(`Proxying ${method} request to: ${url}`);

    // Create axios request config
    const requestConfig = {
      url,
      method: method.toUpperCase(),
      headers,
      params,
      data,
      timeout: Math.min(timeout, MAX_TIMEOUT), // Cap timeout to prevent long-running requests
      validateStatus: function (status: number) {
        // Pass through all status codes to properly handle on the client
        return true;
      }
    };

    // Make the request to the external API
    const apiResponse = await axios(requestConfig);

    // Return the response to the client
    response.status(200).json({
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      headers: apiResponse.headers,
      data: apiResponse.data
    });
    
  } catch (error) {
    console.error('Error in axiosFetch API proxy:', error);
    
    // Format axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error;
      
      if (axiosError.response) {
        // The server responded with a status code outside the 2xx range
        response.status(502).json({
          error: 'API proxy received an error response',
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data
        });
        return;
      } 
      
      if (axiosError.request) {
        // The request was made but no response was received
        response.status(504).json({
          error: 'API proxy request timeout or no response',
          message: axiosError.message
        });
        return;
      }
    }
    
    // Generic error handling
    response.status(500).json({
      error: 'Internal server error in API proxy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
