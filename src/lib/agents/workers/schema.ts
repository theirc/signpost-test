
function create(agent: Agent) {

  const worker = agent.addWorker({ type: "schema" })

  worker.addHandlers([
    { type: "string", direction: "input", title: "Input", name: "input" },
    // { type: "boolean", direction: "output", title: "Is Contact", },
    // { type: "string", direction: "output", title: "Search Keywords", },
    // { type: "string", direction: "output", title: "Language", },
  ])

  return worker

}

async function execute(worker: AIWorker) {

}


export const schema: WorkerRegistryItem = {
  title: "Schema",
  execute,
  create,
  get registry() { return schema },
}

