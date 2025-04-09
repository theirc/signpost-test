
declare global {
  type CombineWorkerMode = "concat" | "nonempty"
  interface CombineWorker extends AIWorker {
    fields: {
      input1: NodeIO
      input2: NodeIO
      output: NodeIO
    }
    parameters: {
      mode?: CombineWorkerMode
    }
  }
}

async function execute(worker: CombineWorker) {

  if (worker.parameters.mode === "nonempty") {
    if (worker.fields.input1.value) {
      worker.fields.output.value = worker.fields.input1.value
    } else {
      worker.fields.output.value = worker.fields.input2.value
    }
  }
  if (worker.parameters.mode === "concat") {
    //ToDo: add other types
    const v1 = worker.fields.input1.value || ""
    const v2 = worker.fields.input2.value || ""
    worker.fields.output.value = `${v1}${v2}`
  }
}


export const combine: WorkerRegistryItem = {
  title: "Combine",
  execute,
  create(agent: Agent) {
    const w = agent.initializeWorker(
      { type: "combine" },
      [
        { type: "unknown", direction: "input", title: "Input", name: "input1" },
        { type: "unknown", direction: "input", title: "Input", name: "input2" },
        { type: "unknown", direction: "output", title: "Result", name: "output" },
      ],
      combine
    ) as CombineWorker
    w.parameters.mode = "nonempty"
    return w
  },
  get registry() { return combine },
}


