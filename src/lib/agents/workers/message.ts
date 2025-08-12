declare global {
  interface MessageWorker extends AIWorker {
    fields: {
      content: NodeIO
      toNumber: NodeIO
      quickReplies: NodeIO
      routeId: NodeIO
      output: NodeIO
    }
    parameters: {
      telerivetApiKey?: string
      telerivetProjectId?: string
      defaultToNumber?: string
      defaultQuickReplies?: string[]
      defaultRouteId?: string
      username?: string
    }
  }
}

function create(agent: Agent) {
  return agent.initializeWorker(
    {
      type: "message",
      conditionable: true,
      parameters: {
        telerivetApiKey: "",
        telerivetProjectId: "",
        defaultToNumber: "",
        defaultQuickReplies: [],
        defaultRouteId: "",
        username: "",
      },
    },
    [
      { type: "string", direction: "input", title: "Content", name: "content" },
      { type: "string", direction: "input", title: "To Number", name: "toNumber" },
      { type: "string[]", direction: "input", title: "Quick Replies", name: "quickReplies" },
      { type: "string", direction: "input", title: "Route ID", name: "routeId" },
      { type: "string", direction: "output", title: "Output", name: "output" },
    ],
    message,
  ) as MessageWorker
}

async function execute(worker: MessageWorker) {
  const logPrefix = `[Telerivet Message Worker (${worker.id})]`
  
  // Log all worker parameters
  console.log(`${logPrefix} - Worker Parameters:`, {
    telerivetApiKey: worker.parameters.telerivetApiKey ? `${worker.parameters.telerivetApiKey.substring(0, 8)}...` : 'NOT SET',
    telerivetProjectId: worker.parameters.telerivetProjectId || 'NOT SET',
    defaultToNumber: worker.parameters.defaultToNumber || 'NOT SET',
    defaultQuickReplies: worker.parameters.defaultQuickReplies || [],
    defaultRouteId: worker.parameters.defaultRouteId || 'NOT SET',
    username: worker.parameters.username || 'NOT SET'
  })
  
  const content = worker.fields.content?.value as string || ""
  const toNumber = worker.fields.toNumber?.value as string || worker.parameters.defaultToNumber || ""
  const quickReplies = worker.fields.quickReplies?.value as string[] || worker.parameters.defaultQuickReplies || []
  const routeId = worker.fields.routeId?.value as string || worker.parameters.defaultRouteId || ""
  
  // Log all field values
  console.log(`${logPrefix} - Field Values:`, {
    content: content || 'NOT SET',
    toNumber: toNumber || 'NOT SET',
    quickReplies: quickReplies || [],
    routeId: routeId || 'NOT SET'
  })
  
  if (!content || !toNumber) {
    worker.fields.output.value = "Error: Content and to_number are required"
    console.error(`${logPrefix} - Validation failed: content=${!!content}, toNumber=${!!toNumber}`)
    return
  }

  try {
    // Helper function to send individual Telerivet messages
    async function sendTelerivetMessage(
      worker: MessageWorker, 
      toNumber: string, 
      content: string, 
      routeId: string, 
      quickReplies: string[], 
      mediaUrls: string[]
    ) {
      const logPrefix = `[Telerivet Message Worker (${worker.id})]`
      
      // Prepare the message payload according to Telerivet API spec
      const messagePayload: any = {
        content: content,
        to_number: toNumber,
        message_type: "text"
      }

      // Add optional fields if provided
      if (routeId) messagePayload.route_id = routeId
      
      // Add media URLs if provided
      if (mediaUrls && mediaUrls.length > 0) {
        messagePayload.media_urls = mediaUrls;
      }
      
      // Add quick replies for WhatsApp if provided
      if (quickReplies && quickReplies.length > 0) {
        messagePayload.route_params = {
          whatsapp: {
            quick_replies: quickReplies.map(text => ({ text: text }))
          }
        }
      }

      // Log the constructed message payload
      console.log(`${logPrefix} - Message Payload:`, messagePayload)

      // Send via Telerivet API using proxy approach to avoid CORS
      const telerivetUrl = `https://api.telerivet.com/v1/projects/${worker.parameters.telerivetProjectId}/messages/send`
      console.log(`${logPrefix} - Telerivet URL:`, telerivetUrl)
      console.log(`${logPrefix} - Project ID from parameters:`, worker.parameters.telerivetProjectId)
      
      // Check if we're in browser environment
      const isBrowser = typeof window !== 'undefined'
      
             if (isBrowser) {
         // Use the proxy API to avoid CORS issues - send API key in POST body
         console.log(`${logPrefix} - Message Payload:`, messagePayload)
         
         // Add API key to the message payload for Telerivet
         const messagePayloadWithKey = {
           ...messagePayload,
           api_key: worker.parameters.telerivetApiKey
         }
         
         const proxyPayload = {
           url: telerivetUrl,
           method: 'POST',
           headers: {
             'Content-Type': 'application/json'
           },
           data: messagePayloadWithKey,
           timeout: 10000
         }
        
        console.log(`${logPrefix} - Proxy Payload:`, proxyPayload)
        
        const proxyResponse = await fetch('/api/axiosFetch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(proxyPayload)
        })
       
        console.log(`${logPrefix} - Proxy Response Status:`, proxyResponse.status, proxyResponse.statusText)
        
        if (proxyResponse.ok) {
          const proxyResult = await proxyResponse.json()
          console.log(`${logPrefix} - Proxy Result:`, proxyResult)
          
          if (proxyResult?.error) {
            worker.fields.output.value = `Proxy error: ${proxyResult.error} ${proxyResult.message || ''}`
            console.error(`${logPrefix} - Proxy returned error:`, proxyResult.error)
          } else {
            const result = proxyResult?.data
            worker.fields.output.value = `Message sent successfully to ${toNumber}. Message ID: ${result?.id || 'Unknown'}`
            console.log(`${logPrefix} - Message sent successfully:`, result)
          }
        } else {
          const errorText = await proxyResponse.text()
          worker.fields.output.value = `Proxy service failed: ${proxyResponse.status} - ${errorText}`
          console.error(`${logPrefix} - Proxy service failed:`, proxyResponse.status, errorText)
        }
             } else {
         // Backend environment - make direct call
         const messagePayloadWithKey = {
           ...messagePayload,
           api_key: worker.parameters.telerivetApiKey
         }
         
         const response = await fetch(telerivetUrl, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json'
           },
           body: JSON.stringify(messagePayloadWithKey)
         })

        if (response.ok) {
          const result = await response.json()
          worker.fields.output.value = `Message sent successfully to ${toNumber}. Message ID: ${result.id}`
        } else {
          const errorText = await response.text()
          worker.fields.output.value = `Failed to send message: ${response.status} - ${errorText}`
        }
      }
    }

    // Extract media URLs from content (markdown image format: ![alt](url))
    const mediaUrls: string[] = [];
    let processedContent = content;
    const imageMatches = processedContent.match(/!\[\]\((https?:\/\/[^\s)]+)\)/g);
    if (imageMatches) {
      imageMatches.forEach((match: string) => {
        const urlMatch = match.match(/!\[\]\((https?:\/\/[^\s)]+)\)/);
        if (urlMatch) {
          mediaUrls.push(urlMatch[1]);
        }
      });
      // Remove image markdown from content
      processedContent = processedContent.replace(/!\[\]\([^\)]+\)/g, "").trim();
    }
    
    // Handle <break> symbol splitting like Cloudscript
    const messageParts = processedContent.split('<break>');
    const hasBreak = messageParts.length > 1;
    
    // Clean message function like Cloudscript
    function cleanMessage(text: string): string {
      text = text.replace(/\*/g, '');
      text = text.replace(/\[[^\]]*\]/g, '');
      text = text.replace(/[ ]{2,}/g, ' ');
      return text;
    }
    
    // Process message parts
    if (hasBreak) {
      // Send multiple messages with breaks
      for (let i = 0; i < messageParts.length; i++) {
        const part = messageParts[i].trim();
        if (part) {
          const cleanPart = cleanMessage(part);
          const quickRepliesForPart = (i === messageParts.length - 1) ? quickReplies : [];
          const mediaUrlsForPart = (i === 0) ? mediaUrls : [];
          
          await sendTelerivetMessage(worker, toNumber, cleanPart, routeId, quickRepliesForPart, mediaUrlsForPart);
          
          // Add delay between messages if not the last part
          if (i < messageParts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      return; // Exit early since we handled the message parts
    }
    
    // Single message - send with media and quick replies
    await sendTelerivetMessage(worker, toNumber, cleanMessage(processedContent), routeId, quickReplies, mediaUrls);
  } catch (error: any) {
    worker.fields.output.value = `Error sending message: ${error.message}`
  }
}

export const message: WorkerRegistryItem = {
  title: "Telerivet Message",
  category: "tool",
  type: "message",
  description: "Sends messages via Telerivet API with optional quick replies",
  execute,
  create,
  get registry() {
    return message
  },
}

