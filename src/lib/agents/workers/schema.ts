
function create(agent: Agent) {

  return agent.initializeWorker(
    { type: "schema" },
    [
      { type: "string", direction: "input", title: "Input", name: "input" },
    ],
    schema
  )

}

async function execute(worker: AIWorker) {

}


export const schema: WorkerRegistryItem = {
  title: "Schema",
  execute,
  create,
  get registry() { return schema },
}

