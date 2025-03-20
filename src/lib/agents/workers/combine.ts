

type CombineMode = "concat" | "nonempty"

declare global {
  interface CombineWorker extends AIWorker {
    parameters: {
      mode?: CombineMode
    }
  }
}


function create(agent: Agent) {

  const w = agent.initializeWorker(
    { type: "combine" },
    [
      { type: "unknown", direction: "input", title: "Input", name: "input1" },
      { type: "unknown", direction: "input", title: "Input", name: "input2" },
      { type: "unknown", direction: "output", title: "Result", name: "result" },
    ],
    combine
  ) as CombineWorker

  w.parameters.mode = "nonempty"

  return w



}

async function execute(worker: CombineWorker) {



}


export const combine: WorkerRegistryItem = {
  title: "Combine",
  execute,
  create,
  get registry() { return combine },
}

