export interface Commands {}
export interface Queries {}

export type CommandName = keyof Commands & string
export type QueryName = keyof Queries & string

type Field<T, F extends string> = T extends { [P in F]: infer X } ? X : never

export type CommandDetails<K extends CommandName> = Field<Commands[K], 'details'>
export type CommandResult<K extends CommandName> = Field<Commands[K], 'result'>
export type CommandRefusal<K extends CommandName> = Field<Commands[K], 'refusal'>

export type QueryDetails<K extends QueryName> = Field<Queries[K], 'details'>
export type QueryAnswer<K extends QueryName> = Field<Queries[K], 'answer'>
export type QueryRefusal<K extends QueryName> = Field<Queries[K], 'refusal'>

export type Executed<K extends CommandName> =
  | { command: K, was: 'done', result: CommandResult<K> }
  | { command: K, was: 'refused', reason: 'nobody-handles' | CommandRefusal<K> }
  | { command: K, was: 'failed', error: unknown }

export type Answered<K extends QueryName> =
  | { query: K, was: 'answered', answer: QueryAnswer<K> }
  | { query: K, was: 'refused', reason: 'nobody-answers' | QueryRefusal<K> }
  | { query: K, was: 'failed', error: unknown }

export type Handler<K extends CommandName> =
  (details: CommandDetails<K>) => Promise<Executed<K>>
export type Answerer<K extends QueryName> =
  (details: QueryDetails<K>) => Promise<Answered<K>>

const handlers = new Map<string, (details: unknown) => Promise<unknown>>()
const answerers = new Map<string, (details: unknown) => Promise<unknown>>()

export const handles = <K extends CommandName>(command: K, by: Handler<K>): void => {
  if (handlers.has(command)) throw new Error(`${command} already has a handler`)
  handlers.set(command, by as (details: unknown) => Promise<unknown>)
}

export const answers = <K extends QueryName>(query: K, by: Answerer<K>): void => {
  if (answerers.has(query)) throw new Error(`${query} already has an answerer`)
  answerers.set(query, by as (details: unknown) => Promise<unknown>)
}

export const execute = async <K extends CommandName>(
  command: K, details: CommandDetails<K>
): Promise<Executed<K>> => {
  const by = handlers.get(command)
  if (!by) return { command, was: 'refused', reason: 'nobody-handles' }
  try {
    return await by(details) as Executed<K>
  } catch (error) {
    return { command, was: 'failed', error }
  }
}

export const query = async <K extends QueryName>(
  name: K, details: QueryDetails<K>
): Promise<Answered<K>> => {
  const by = answerers.get(name)
  if (!by) return { query: name, was: 'refused', reason: 'nobody-answers' }
  try {
    return await by(details) as Answered<K>
  } catch (error) {
    return { query: name, was: 'failed', error }
  }
}

export const done = <K extends CommandName>(command: K, result: CommandResult<K>): Executed<K> =>
  ({ command, was: 'done', result })

export const answered = <K extends QueryName>(name: K, answer: QueryAnswer<K>): Answered<K> =>
  ({ query: name, was: 'answered', answer })
