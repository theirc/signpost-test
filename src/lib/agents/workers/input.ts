
interface InputWorker extends AIWorker {
}


function create(agent: Agent) {

  const worker = agent.addWorker({ type: "request" })

  worker.addHandlers([
    { type: "execute", direction: "output", title: "Next", },
  ])

  return worker

}

async function execute(worker: InputWorker) {

}


export const request: WorkerRegistryItem = {
  title: "Input",
  execute,
  create,
  get registry() { return request },
}

