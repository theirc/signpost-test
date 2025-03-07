
function create(agent: Agent) {

  const worker = agent.addWorker({ type: "response" })

  worker.addHandlers([
    { type: "execute", direction: "input", title: "Execute", name: "execute" },
    { type: "string", direction: "input", title: "Answer", name: "answer" },
  ])

  return worker

}

async function execute(worker: AIWorker) {

}


export const response: WorkerRegistryItem = {
  title: "Response",
  execute,
  create,
  get registry() { return response },
}

