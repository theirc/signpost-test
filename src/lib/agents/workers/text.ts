
function create(agent: Agent) {

  const worker = agent.addWorker({ type: "text" })

  worker.addHandlers([
    { type: "string", direction: "output", title: "Output", persistent: true, name: "output" },
  ])

  return worker

}

async function execute(worker: AIWorker) {

}


export const text: WorkerRegistryItem = {
  title: "Text",
  execute,
  create,
  get registry() { return text },
}

