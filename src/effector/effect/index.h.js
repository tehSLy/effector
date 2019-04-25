//@flow
import type {Subscription, Subscriber} from '../index.h'
import type {kind, Graph, Unit} from 'effector/stdlib'
import type {Event} from 'effector/event'
import type {CompositeName} from '../compositeName'

export type Effect<Params, Done, Fail = Error> = /*::interface extends Unit*/ {
  /*::
  [[call]](payload: Params): Promise<Done>,
  */
  done: Event<{params: Params, result: Done}>,
  fail: Event<{params: Params, error: Fail}>,
  /*::+*/ id: string,
  use: {
    /*::
    [[call]](asyncFunction: (params: Params) => Promise<Done> | Done): void,
    */
    getCurrent(): (params: Params) => Promise<Done>,
  },
  create(payload: Params): any,
  watch(watcher: (payload: Params) => any): Subscription,
  //map<T>(fn: (_: E) => T): Event<T>,
  prepend<Before>(fn: (_: Before) => Params): Event<Before>,
  subscribe(subscriber: Subscriber<Params>): Subscription,
  +kind: kind,
  shortName: string,
  graphite: Graph,
  compositeName: CompositeName,
}

export type FnEffect<Params, Done, Fail = Error, +Fn = Function> = {
  // (payload: Params): Future<Params, Done, Fail>,
  /*::
  [[call]]: Fn,
  */
  +done: Event<{params: Params, result: Done}>,
  +fail: Event<{params: Params, error: Fail}>,
  /*::+*/ id: string,
  +use: {
    (asyncFunction: Fn): void,
    getCurrent(): Fn,
  },
  create(payload: Params, type: string, args: any[]): Params,
  +watch: (watcher: (payload: Params) => any) => Subscription,
  // getNode(): Vertex<['event', string]>,
  //map<T>(fn: (_: E) => T): Event<T>,
  prepend<Before>(fn: (_: Before) => Params): Event<Before>,
  subscribe(subscriber: Subscriber<Params>): Subscription,
  +kind: kind,
  shortName: string,
  graphite: Graph,
  compositeName: CompositeName,
}

export type Thunk<Args, Done> = (_: Args) => Promise<Done>
