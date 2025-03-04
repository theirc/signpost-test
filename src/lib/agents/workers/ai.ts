
function create(agent: Agent) {

  const worker = agent.addWorker({ type: "ai" })

  worker.addHandlers([
    { type: "execute", direction: "input", title: "Execute", },
    { type: "execute", direction: "output", title: "Next", },
    { type: "string", direction: "input", title: "Input", },
    { type: "string", direction: "input", title: "Prompt", },
    { type: "string", direction: "output", title: "Answer", },
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

