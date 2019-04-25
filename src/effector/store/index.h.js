//@flow
import type {Subscription} from '../index.h'
import type {Graph, kind, StateRef, ID, Unit} from 'effector/stdlib'
import type {Event} from 'effector/event'
import type {Effect} from 'effector/effect'
import type {CompositeName} from '../compositeName'

export type ThisStore = {
  compositeName?: CompositeName,
  defaultState: any,
  +graphite: Graph,
  +id: string,
  kind: kind,
  plainState: StateRef,
  shortName: ID,
  subscribers: Map<Event<any>, Subscription>,
}

export type Store<State> = /*::interface extends Unit*/ {
  /*::+*/ id: string,
  /*::+*/ stateRef: StateRef,
  reset(trigger: Unit): Store<State>,
  getState(): State,
  setState(newState: State): void,
  //prettier-ignore
  /*::+*/ map: (
    & (<T>(fn: (_: State, lastState?: T) => T, _: void) => Store<T>)
    & (<T>(fn: (_: State, lastState: T) => T, firstState: T) => Store<T>)
  ),
  on<E>(
    event: Event<E> | Effect<E, any, any> | Store<E>,
    handler: (state: State, payload: E) => State | void,
  ): Store<State>,
  off(event: Event<any>): void,
  subscribe(listner: any): Subscription,
  //prettier-ignore
  /*::+*/ watch: (
    & (
      <E>(
        watcher: (state: State, payload: E) => any,
        _: void,
      ) => Subscription
    )
    & (
      <E>(
        trigger: Store<E>,
        watcher: (state: State, payload: E) => any,
      ) => Subscription
    )
    & (
      <E>(
        event: Event<E>,
        watcher: (state: State, payload: E) => any,
      ) => Subscription
    )
    & (
      <E>(
        effect: Effect<E, any, any>,
        watcher: (state: State, payload: E) => any,
      ) => Subscription
    )
  ),
  +kind: kind,
  +defaultState: State,
  shortName: string,
  +graphite: Graph,
  compositeName?: CompositeName,
}
