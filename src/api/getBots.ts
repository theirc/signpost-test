import { ChatSession } from "@/bot/history";
import { ChatMessage, BotHistory, BotQualification } from "@/types/types.ai";

export const serverurl = "https://directus-qa-support.azurewebsites.net";

export const api = {
  getBots: async () => await getFromServer<{ [index: number]: string }>(`${serverurl}/bots`),

  askbot: async (req: ChatMessage, tts: boolean = false, bots: { label: string, value: number, history: BotHistory[] }[] = []) => {
    console.log("Request: ", bots);
    let answer: ChatMessage = {
      type: "bot",
      messages: [],
      question: req.message,
      tts
    };

    if (!bots.length) return answer;

    for (const b of bots) {
      let a: ChatMessage = {}; 
      const breq = { 
        ...req, 
        id: b.value, 
        history: b.history || [], 
        audio: req.audio, 
        tts 
      };

      let options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(breq)
      };

      try {
        const response = await fetch(`${serverurl}/ai/`, options);
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        a = await response.json();
      } catch (error) {
        a.error = error?.toString() ?? "Error";
        console.log("Error Contacting Bot", error);
      }

      if (a.error) a.message = a.error;
      a.type = "bot";
      a.id = b.value;
      a.botName = b.label;
      a.question = req.message;
      a.audio = req.audio;
      answer.messages.push(a);
    }

    saveChatHistory(req, answer)

    return answer;
  },

  qualifyBot: async (r: BotQualification) => {
    let options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r)
    };

    try {
      const response = await fetch(`${serverurl}/qualifybot/`, options);
      return await response.json();
    } catch (error) {
      console.log("Error Scoring Bot", error);
    }
  }
}

const saveChatHistory = (userMessage: ChatMessage, botResponse: ChatMessage) => {
  const LOCAL_STORAGE_KEY = "chatHistory"

  let existingHistory: ChatSession [] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]")
  console.log("Existing Chat History:", existingHistory)

  const currentBotName = botResponse.messages[0]?.botName

  let activeSession = existingHistory.find(session => 
    session.botName === currentBotName
  );
  
  if (activeSession) {
    
    if (userMessage.message) {
      activeSession.messages.push({
        type: "human",
        message: userMessage.message
      })
    }
    
    botResponse.messages.forEach(msg => {
      if (msg.message) {
        activeSession.messages.push({
          type: "bot",
          botName: msg.botName,
          message: msg.message,
          id: msg.id
        })
      }
    })
    
    activeSession.timestamp = new Date().toLocaleString();
  } else {
    console.log("Creating a new chat session...");
    
    const formattedMessages: ChatMessage[] = [];
    
    if (userMessage.message) {
      formattedMessages.push({
        type: "human",
        message: userMessage.message
      })
    }
    
    botResponse.messages.forEach(msg => {
      if (msg.message) {
        formattedMessages.push({
          type: "bot",
          botName: msg.botName,
          message: msg.message,
          id: msg.id
        })
      }
    })
      
      const newChat: ChatSession = {
      id: new Date().toISOString(),
      botName: currentBotName,
      messages: formattedMessages,
      timestamp: new Date().toLocaleString(),
      selectedBots: []
    }
    existingHistory.unshift(newChat)
  }
    
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingHistory));
  console.log("Saved Chat History in LocalStorage")
}

async function getFromServer<T>(url: string): Promise<Awaited<T>> {
  let ret: any = null;
  console.log("Loading from Server: ", url);
  try {
    ret = await fetch(url).then(r => r.json());
  } catch (error) {
    console.log(`Error Loading ${url}`, error);
  }
  console.log("Loaded from Server: ", ret);
  return ret;
}