
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'


declare global {
  interface BotWorker extends AIWorker {
    fields: {
      prompt: NodeIO
      input: NodeIO
      answer: NodeIO
    }
    parameters: {
      temperature?: number
    }

  }
}

function create(agent: Agent) {

  return agent.initializeWorker(
    { type: "ai" },
    [
      // { type: "any", direction: "input", title: "Condition", name: "condition" },
      // { type: "execute", direction: "input", title: "Execute", name: "execute" },
      { type: "string", direction: "input", title: "Prompt", name: "prompt", persistent: true },
      { type: "string", direction: "input", title: "Input", name: "input" },
      { type: "string", direction: "output", title: "Answer", name: "answer" },
      // { type: "execute", direction: "output", title: "Next", name: "next" },
    ],
    ai
  )

}



async function execute(worker: BotWorker) {

  const apiKey = localStorage.getItem("openai-api-key")
  const openai = createOpenAI({ apiKey })

  const { text } = await generateText({
    model: openai('gpt-4-turbo') as any,
    prompt: worker.fields.prompt.value + "\n\n" + worker.fields.input.value,
  })

  worker.fields.answer.value = text

}


export const ai: WorkerRegistryItem = {
  title: "AI",
  execute,
  create,
  get registry() { return ai },
}

