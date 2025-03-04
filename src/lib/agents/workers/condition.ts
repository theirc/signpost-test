
function create(agent: Agent) {

  const worker = agent.addWorker({ type: "condition" })

  worker.addHandlers([
    { type: "execute", direction: "input", title: "Execute", name: "execute" },
    { type: "any", direction: "input", title: "Input", name: "input" },
    { type: "execute", direction: "output", title: "True", name: "true" },
    { type: "execute", direction: "output", title: "False", name: "false" }
  ])

  return worker

}

async function execute(worker: AIWorker) {

}


export const condition: WorkerRegistryItem = {
  title: "Condition",
  execute,
  create,
  get registry() { return condition },
}

