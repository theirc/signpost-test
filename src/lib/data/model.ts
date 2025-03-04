import { ZodType } from "zod"
import { Database } from "./supabase"

type FieldTypes = "string" | "number" | "boolean"

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

  interface Field<T = any> {
    title?: string
    name?: string
    type: FieldTypes
    validate?: ZodType
    list?: { value: any, label: string }[]
    // required?: boolean
  }

  interface Model<T = any> {
    title?: string
    fields?: FieldsOfType<T>
    defaultValue?: T
  }

  export interface ModelDeclaration<T extends { [key: string]: Field }> {
    title?: string
    fields: T
    defaultValue?: ConfigToType<T>
  }
  interface SupabaseModel<T extends TableKeys = any> extends Model<Database["public"]["Tables"][T]["Row"]> {
  }

}


export function createSupabaseModel<T, M extends Model>(model: M, pgb: T): T & { model: M } {
  pgb["model"] = model
  return pgb as any
}


export function createModel<T extends { [key: string]: Field }>(model: ModelDeclaration<T>): Model<ConfigToType<T>> {
  model.fields = model.fields || {} as any
  model.defaultValue = model.defaultValue || {}
  for (const key in model.fields) {
    const field: Field = model.fields[key] as any
    field.name = field.name || key
  }
  return model as any
}

