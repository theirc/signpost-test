
function create(agent: Agent) {

  const worker = agent.addWorker({ type: "stt" })

  worker.addHandlers([
    { type: "audio", direction: "input", title: "Input", name: "input" },
    { type: "string", direction: "output", title: "Output", name: "output" },
  ])

  return worker

}

async function execute(worker: AIWorker) {

}


export const stt: WorkerRegistryItem = {
  title: "Speech to Text",
  execute,
  create,
  get registry() { return stt },
}

