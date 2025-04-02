import { loadAgenttest } from "./loadagent"

export async function GET(request: Request) {

  const a = await loadAgenttest(22)

  return Response.json({
    message: a
  })
}

