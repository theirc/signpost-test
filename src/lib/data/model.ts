import { ZodType } from "zod"
import { Database } from "../agents/supabase"
import { supabase } from "."

type FieldTypes = "string" | "number" | "boolean" | "json" | "string[]"

type FieldsOfType<T> = {
  [K in keyof T]: Field<T[K]>
}

type TableKeys = keyof Database["public"]["Tables"]

type UnpackedFields<T> = {
  [P in keyof T]?: T[P] extends Field<infer U> ? Field<U> : never
}

type ConfigToType<T> = {
  [P in keyof T]?
  : T[P] extends { type: "string" } ? string
  : T[P] extends { type: "boolean" } ? boolean
  : T[P] extends { type: "object" } ? object
  : T[P] extends { type: "number" } ? number
  : T[P] extends { type: "number[]" } ? number[]
  : T[P] extends { type: "string[]" } ? string[]
  : never
}

declare global {

  type FieldList = { value: any, label: string }[]

  interface Field<T = any> {
    title?: string
    name?: string
    type?: FieldTypes
    validate?: ZodType
    list?: FieldList
    hidden?: boolean
  }

  interface Model<T = any> {
    title?: string
    fields?: FieldsOfType<T>
    defaultValue?: T
    type?: "local" | "supabase"
    withFunctions?<F>(fn: F): this & F
    data?: unknown
  }

  export interface ModelDeclaration<T extends { [key: string]: Field }> {
    title?: string
    fields: T
    defaultValue?: ConfigToType<T>
  }

  interface SupabaseModel<T extends TableKeys = any> extends Model<Database["public"]["Tables"][T]["Row"]> {
    withFunctions?<F>(fn: F): this & F
  }

  interface FunctionExtender {
    withFunctions?<F>(fn: F): this & F
  }

}


export function createSupabaseModel_OLD<T, M extends SupabaseModel>(modelDeclaration: M, pgb: T): T & { model: M, data: T } & FunctionExtender {
  const model = createModel({
    fields: modelDeclaration.fields,
    defaultValue: modelDeclaration.defaultValue
  })
  model.type = "supabase"
  // model.supabaseQuery = pgb
  pgb["model"] = model
  pgb["withFunctions"] = fn => Object.assign(pgb, fn)
  return pgb as any
}


export function createSupabaseModel<T, M extends SupabaseModel, K extends TableKeys>(modelDeclaration: M, pgb: T, table: K): M & { data: T } {
  const model = createModel({
    fields: modelDeclaration.fields,
    defaultValue: modelDeclaration.defaultValue
  })
  Object.defineProperty(model, "data", { get: () => supabase.from(table) })
  model.type = "supabase"
  return model as any
}


export function createModel<T extends { [key: string]: Field }>(d: ModelDeclaration<T>): Model<ConfigToType<T>> {
  const model: Model = {}
  model.fields = d.fields || {} as any
  model.defaultValue = d.defaultValue || {}
  model.type = "local"
  for (const key in model.fields) {
    const field: Field = model.fields[key] as any
    field.name = field.name || key
  }
  model.withFunctions = fn => Object.assign(model, fn)
  return model as any
}

