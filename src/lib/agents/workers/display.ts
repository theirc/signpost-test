
declare global {
  interface MockWorker extends AIWorker {
    fields: {
      input: NodeIO
      output: NodeIO
    }
  }
}

async function execute(worker: AIWorker) {

  worker.fields.output.value = worker.fields.input.value

}

export const display: WorkerRegistryItem = {
  title: "Display",
  execute,
  category: "debug",
  type: "display",
  description: "This worker allows you to display data for testing purposes.",
  create(agent: Agent) {
    return agent.initializeWorker(
      { type: "display" },
      [
        { type: "unknown", direction: "input", title: "Input", name: "input" },
        { type: "unknown", direction: "output", title: "Ouput", name: "output" },
      ],
      display
    )
  },
  get registry() { return display },
}

