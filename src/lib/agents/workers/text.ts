
declare global {
  interface TextWorker extends AIWorker {
    fields: {
      output: NodeIO
    },
    parameters: {
      text?: string
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

async function execute(worker: TextWorker) {
  worker.fields.output.value = worker.parameters.text || ""
}


export const text: WorkerRegistryItem = {
  title: "Text",
  execute,
  create,
  get registry() { return text },
}

