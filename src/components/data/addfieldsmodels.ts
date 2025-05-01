import { inputOutputTypes } from "@/lib/agents/worker"
import { createModel } from "@/lib/data/model"
import { z } from "zod"

export const model = createModel({
  fields: {
    id: { title: "ID", type: "string", },
    name: {
      title: "Name", type: "string",
      validate: z.coerce.string().min(1, { message: "Required Field" }).regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/, { message: "Must start with a letter or _ and only letters, numbers and _ are allowed." }),
    },
    prompt: { title: "Description", type: "string", },
    type: {
      title: "Type", type: "string",
      list: Object.entries(inputOutputTypes).filter(([k, v]) => k !== "unknown").map(([k, v]) => ({ value: k, label: v }))
    },
    enum: { title: "Enumeration", type: "string[]", },
  }
})