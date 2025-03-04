
function create(agent: Agent) {

  const worker = agent.addWorker({ type: "select" })

  worker.addHandlers([
    { type: "any", direction: "input", title: "Input", },
    { type: "any", direction: "input", title: "Input", },
    { type: "any", direction: "output", title: "Selected", },
  ])

  return worker

}

async function execute(worker: AIWorker) {

}


export const select: WorkerRegistryItem = {
  title: "Select",
  execute,
  create,
  get registry() { return select },
}

