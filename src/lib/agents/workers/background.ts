
function create(agent: Agent) {

  const worker = agent.addWorker({ type: "background" })

  worker.addHandlers([
    { type: "execute", direction: "input", title: "Execute", name: "execute" },
    { type: "execute", direction: "output", title: "Background", name: "background" },
    { type: "execute", direction: "output", title: "Next", name: "next" }
  ])

  return worker

}

async function execute(worker: AIWorker) {

}


export const background: WorkerRegistryItem = {
  title: "Background Process",
  execute,
  create,
  get registry() { return background },
}

