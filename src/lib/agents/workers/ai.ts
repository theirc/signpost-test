

declare global {
  interface BotWorker extends AIWorker {
    fields: {
      prompt: NodeIO
    }
  }
}

function create(agent: Agent) {

  const worker = agent.addWorker({ type: "ai" })

  worker.addHandlers([
    { type: "string", direction: "input", title: "Prompt", name: "prompt" },
    { type: "string", direction: "input", title: "Input", name: "input" },
    { type: "string", direction: "output", title: "Answer", name: "answer" },
    { type: "execute", direction: "output", title: "Next", name: "next" },
  ])


  return worker

}

async function execute(worker: AIWorker) {

}


export const ai: WorkerRegistryItem = {
  title: "AI",
  execute,
  create,
  get registry() { return ai },
}

