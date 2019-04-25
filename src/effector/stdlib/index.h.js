//@flow

export type ID = string

//prettier-ignore
export type kind =
  | 'store'
  | 'event'
  | 'effect'

export type StateRef = {
  +id: ID,
  current: any,
}
export type NodeMeta = {
  fullName?: string,
  section?: ID,
}
export type TypeDef<+Type> = {
  +id: ID,
  +type: Type,
  +data: any,
}
//prettier-ignore
export type Cmd =
  | Update
  | Run
  | Filter
  | Emit
  | Compute
  | Barrier
  | Tap

export type Barrier = {|
  +id: ID,
  +type: 'barrier',
  +data: {|
    +barrierID: ID,
    meta?: NodeMeta,
  |},
|}

export type Update = {|
  +id: ID,
  +type: 'update',
  +data: {|
    store: StateRef,
    meta?: NodeMeta,
  |},
|}
export type Run = {|
  +id: ID,
  +type: 'run',
  +data: {|
    fn: (data: any, scope: {[string]: any}) => any,
    meta?: NodeMeta,
  |},
|}

export type Filter = {|
  +id: ID,
  +type: 'filter',
  +data: {|
    fn: (data: any, scope: {[string]: any}) => boolean,
    meta?: NodeMeta,
  |},
|}
export type Emit = {|
  +id: ID,
  +type: 'emit',
  +data: {|
    fullName: string,
    meta?: NodeMeta,
  |},
|}
export type Compute = {|
  +id: ID,
  +type: 'compute',
  +data: {|
    fn: (data: any, scope: {[string]: any}) => any,
    meta?: NodeMeta,
  |},
|}

export type Tap = {|
  +id: ID,
  +type: 'tap',
  +data: {|
    fn: (data: any, scope: {[string]: any}) => any,
    meta?: NodeMeta,
  |},
|}

export type Graph = {
  +from: Array<Graph>,
  +next: Array<Graph>,
  +seq: Array<Cmd>,
  +scope: {[string]: any},
  +meta: {[tag: string]: any},
}

//prettier-ignore
export type Graphite =
  | {+graphite: Graph, ...}
  | Graph

export type Unit = /*::interface*/ {
  +graphite: Graph,
}
