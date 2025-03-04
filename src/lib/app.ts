import { buildAgent } from "./agents"
import { agents } from "./data/models/agents"

export const app = {
  agent: null as Agent,
}

// console.log(agents)


app.agent = buildAgent({
  id: "1",
  title: "Demo",
  workers: {}
})

