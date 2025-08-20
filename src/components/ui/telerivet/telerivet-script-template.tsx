export const TELERIVET_SCRIPT_TEMPLATE = `// --- Configuration Variables ---
var SIGNPOST_AI_URL = "https://signpost-ia-app.azurewebsites.net/agent";
var TEAM_ID = "{{TEAM_ID}}";
var WHATSAPP_PHONE_NUMBER_ID = "XXX";
var WHATSAPP_ACCESS_TOKEN = "XXX";
var SIGNPOST_AI_ID = {{AGENT_ID}};
var STT_AI_ID = 159;
var OPENAI_API_KEY = "{{OPENAI_API_KEY}}"; // Set your OpenAI API key here
var AUDIO_TRANSCRIPTION_DELAY_MS = 1000;
var IMAGE_PROCESSING_DELAY_MS = 1500;

// --- Base64 encoding function (kept for audio processing) ---
var btoa = (function() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    
    function btoa(input) {
        var str = String(input);
        var output = '';
        for (
            var block, charCode, idx = 0, map = chars; str.charAt(idx | 0) || (map = '=', idx % 1); output += map.charAt(63 & block >> 8 - idx % 1 * 8)
        ) {
            charCode = str.charCodeAt(idx += 3 / 4);
            if (charCode > 0xFF) {
                throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
            }
            block = block << 8 | charCode;
        }
        return output;
    }
    return btoa;
}());

// --- Ensure UUID per contact ---
function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    } else {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

if (!contact.vars || !contact.vars.custom_uuid) {
    contact.vars.custom_uuid = generateUUID();
    contact.save();
}

// --- Get incoming message content ---
var incomingMessage = (typeof content !== 'undefined' && content && content.trim()) ?
    content.trim() :
    (message && message.content ? message.content.trim() : "");

// --- Handle Audio Messages (STT) and Image Messages (Vision) ---
var hasAudio = false;
var hasImage = false;
var transcribedText = "";
var imageDescription = "";

try {
    if (message && message.media && Array.isArray(message.media)) {
        // Check for audio
        var audioMedia = message.media.find(function(mediaItem) {
            return mediaItem.type && mediaItem.type.startsWith('audio/');
        });
        
        // Check for images
        var imageMedia = message.media.find(function(mediaItem) {
            return mediaItem.type && mediaItem.type.startsWith('image/');
        });
        
        // Process audio if found (KEEPING ORIGINAL APPROACH - it works!)
        if (audioMedia) {
            hasAudio = true;
            console.log("Audio message detected, processing...");
            
            try {
                var audioResponse = httpClient.request(audioMedia.url, {
                    method: "GET"
                });
                
                if (audioResponse.status === 200) {
                    var audioExtension = audioMedia.type.split('/')[1] || 'ogg';
                    var base64Audio = btoa(audioResponse.content);
                    
                    var sttPayload = {
                        id: STT_AI_ID,
                        team_id: TEAM_ID,
                        audio: {
                            audio: base64Audio,
                            ext: audioExtension
                        }
                    };
                    
                    var sttAgentResponse = httpClient.request(SIGNPOST_AI_URL, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        data: JSON.stringify(sttPayload)
                    });
                    
                    if (sttAgentResponse.status === 200) {
                        var sttResponseData = JSON.parse(sttAgentResponse.content);
                        transcribedText = sttResponseData.text || "";
                        
                        if (transcribedText && transcribedText.trim()) {
                            console.log("Transcribed text: " + transcribedText);
                            
                            // Send transcribed text back to user
                            project.sendMessage({
                                to_number: contact.phone_number,
                                content: "🗣️\\"" + transcribedText + "\\""
                            });
                            
                            // Use transcribed text as the message content - this is critical!
                            incomingMessage = transcribedText.trim();
                            
                            // Add delay after transcription
                            sleep(AUDIO_TRANSCRIPTION_DELAY_MS);
                        } else {
                            console.log("No transcribed text received or empty text");
                            incomingMessage = "I received an audio message but couldn't transcribe it.";
                        }
                    } else {
                        console.log("STT API error: " + sttAgentResponse.status);
                    }
                } else {
                    console.log("Failed to download audio: " + audioResponse.status);
                }
            } catch (err) {
                console.log("Audio processing error: " + err.toString());
            }
        }
        
        // Process image if found (MEMORY-SAFE APPROACH - direct URL to OpenAI)
        if (imageMedia) {
            hasImage = true;
            console.log("Image message detected, processing with vision API...");
            
            try {
                // MEMORY-SAFE: Use direct URL instead of downloading and encoding
                var visionPayload = {
                    model: "gpt-4o",
                    messages: [
                    {
                        role: "user",
                        content: [
                        {
                            type: "text",
                            text: "Analyze this image and provide a comprehensive description. Describe what you see in detail. The main purpose of this is to summarize details of images for teachers, so pay close attention to fully describing any written content you might see and if you notice any errors in written work point them out."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageMedia.url // Direct URL - no base64 needed!
                            }
                        }]
                    }],
                    max_tokens: 1000
                };
                
                // Call OpenAI Vision API
                var visionResponse = httpClient.request("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": "Bearer " + OPENAI_API_KEY,
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(visionPayload)
                });
                
                if (visionResponse.status === 200) {
                    var visionData = JSON.parse(visionResponse.content);
                    imageDescription = visionData.choices && visionData.choices[0] && visionData.choices[0].message ?
                        visionData.choices[0].message.content :
                        "";
                    
                    if (imageDescription && imageDescription.trim()) {
                        console.log("Image description: " + imageDescription.substring(0, 200) + "...");
                        
                        // Send image description back to user
                        project.sendMessage({
                            to_number: contact.phone_number,
                            content: "👀"
                        });
                        
                        // Use image description as the message content
                        incomingMessage = "message text: " + message.content + "User sent an image. " + imageDescription;
                        
                    } else {
                        console.log("No image description received");
                    }
                } else {
                    console.log("Vision API error: " + visionResponse.status);
                    console.log("Vision API error response: " + visionResponse.content);
                    incomingMessage = "I received an image but couldn't analyze it.";
                }
            } catch (err) {
                console.log("Image processing error: " + err.toString());
                incomingMessage = "I received an image but encountered an error processing it.";
            }
        }
    }
} catch (e) {
    console.log("Media detection error: " + e.toString());
}

// --- CLEAR command ---
if (incomingMessage.toLowerCase() === "clear") {
    contact.vars.custom_uuid = generateUUID();
    contact.save();
    
    project.sendMessage({
        to_number: contact.phone_number,
        content: "✅ Conversation history cleared. Let's start fresh! 🗑️"
    });
    
    // Stop here so we don't forward "clear" to Signpost AI
    return;
}

// --- Typing Indicator Helpers ---
function sendTypingIndicator(phoneNumber, messageId, isTyping) {
    try {
        var typingPayload = {
            messaging_product: "whatsapp",
            status: "read",
            message_id: messageId
        };
        if (isTyping) {
            typingPayload.typing_indicator = { type: "text" };
        }
        var typingUrl = "https://graph.facebook.com/v19.0/" + WHATSAPP_PHONE_NUMBER_ID + "/messages";
        var typingResponse = httpClient.request(typingUrl, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + WHATSAPP_ACCESS_TOKEN,
                "Content-Type": "application/json"
            },
            data: JSON.stringify(typingPayload)
        });
        return typingResponse.status === 200;
    } catch (err) {
        return false;
    }
}

function startTypingIndicator(phoneNumber, messageId) {
    return sendTypingIndicator(phoneNumber, messageId, true);
}

function stopTypingIndicator(phoneNumber, messageId) {
    return sendTypingIndicator(phoneNumber, messageId, false);
}

// --- Determine WhatsApp Message ID ---
var whatsappMessageId = null;
if (message && message.id) {
    try {
        var messageDetails = project.getMessageById(message.id);
        if (messageDetails && messageDetails.route_params && messageDetails.route_params.whatsapp) {
            whatsappMessageId = messageDetails.route_params.whatsapp.message_id;
        } else if (messageDetails && messageDetails.external_id) {
            whatsappMessageId = messageDetails.external_id;
        } else {
            whatsappMessageId = message.id;
        }
    } catch (err) {
        whatsappMessageId = message.id;
    }
}

// --- Prepare payload ---
var payload = {
    id: SIGNPOST_AI_ID,
    uid: contact.vars.custom_uuid || "",
    message: incomingMessage || "Hello", // This should now contain transcribed text for audio messages
    to_number: contact.phone_number,
    team_id: TEAM_ID
};

console.log("Final message being sent to AI: " + (incomingMessage || "Hello"));

// --- Start Typing Indicator if WhatsApp ---
if (whatsappMessageId && whatsappMessageId.startsWith('wamid.')) {
    startTypingIndicator(contact.phone_number, whatsappMessageId);
}

// --- Send to Signpost AI ---
try {
    var response = httpClient.request(SIGNPOST_AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(payload)
    });
    console.log("Payload sent:", JSON.stringify(payload));
    console.log("Signpost AI response status: " + response.status);
    console.log("Signpost AI response content: " + response.content);
    
} catch (err) {
    console.log("Error sending to Signpost AI: " + err.toString());
}

// --- Stop Typing Indicator if WhatsApp ---
if (whatsappMessageId && whatsappMessageId.startsWith('wamid.')) {
    stopTypingIndicator(contact.phone_number, whatsappMessageId);
}`; 
