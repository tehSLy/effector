//@flow

import type {Store} from './index.h'
import {type Event, createEvent} from 'effector/event'

declare export function createApi<
  S,
  Obj: {-[name: string]: (store: S, e: any) => S},
>(
  store: Store<S>,
  setters: Obj,
): $ObjMap<Obj, <E>(h: (store: S, e: E) => S) => Event<E>>

export function createApi(store: Store<any>, handlers: {[string]: Function}) {
  const result = {}
  for (const key in handlers) {
    const event = (result[key] = createEvent(key))
    store.on(event, (handlers[key]: any))
  }
  return result
}
