
declare global {
  interface TextWorker extends AIWorker {
    fields: {
      output: NodeIO
    }
  }
}

function create(agent: Agent) {

  return agent.initializeWorker(
    { type: "text" },
    [
      // { type: "any", direction: "input", title: "Condition", name: "condition" },
      { type: "string", direction: "output", title: "Output", name: "output", persistent: true },
    ],
    text
  )

}

async function execute(worker: AIWorker) {


}


export const text: WorkerRegistryItem = {
  title: "Text",
  execute,
  create,
  get registry() { return text },
}

