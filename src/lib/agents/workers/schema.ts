import { createJsonTranslator, createLanguageModel } from "typechat"
import { createTypeScriptJsonValidator } from "typechat/ts"


declare global {
  interface SchemaWorker extends AIWorker {
    fields: {
      input: NodeIO
    }
    parameters: {
      temperature?: number
    }

  }
}

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

  const handlers = worker.getUserHandlers()
  const input = worker.fields.input.value

  if (!input) return

  let schema = `
  
  export interface Schema {
  
  `

  for (let s of handlers) {
    let type = ""
    if (s.type == "boolean") {
      type = "boolean"
    } else if (s.type == "number") {
      type = "number"
    } else if (s.type == "string") {
      type = "string"
    } else {
      type = "any"
    }

    schema += `

    /*
    ${s.prompt}
    */
    ${s.name}?: ${type}

    `

  }

  schema += `
  
  }
  `

  const apiKey = localStorage.getItem("openai-api-key")
  const schemaModel = createLanguageModel({
    OPENAI_MODEL: "gpt-4o",
    OPENAI_API_KEY: apiKey,
  })


  const validator = createTypeScriptJsonValidator<any>(schema, "Schema")
  const translator = createJsonTranslator<any>(schemaModel, validator)
  const routeresponse = await translator.translate(input)


  if (routeresponse.success) {
    for (const key in routeresponse.data) {
      const h = handlers.find((h) => h.name == key)
      if (h) worker.fields[h.name].value = routeresponse.data[key]
    }
  }

}


export const schema: WorkerRegistryItem = {
  title: "Schema",
  execute,
  create,
  get registry() { return schema },
}

