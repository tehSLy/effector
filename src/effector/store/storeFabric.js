//@flow
import $$observable from 'symbol-observable'

import {step, createGraph, Kind, createStateRef} from 'effector/stdlib'

import type {Store, ThisStore} from './index.h'
import type {StoreConfigPart as ConfigPart} from '../config'
import {createName, type CompositeName} from '../compositeName'
import {
  reset,
  getState,
  off,
  on,
  observable,
  watch,
  subscribe,
  mapStore,
} from './storeMethods'
import {launch} from 'effector/kernel'

export function storeFabric<State>(props: {
  currentState: State,
  config?: ConfigPart,
  parent?: CompositeName,
}): Store<State> {
  const {currentState, config = {}, parent} = props
  const plainState = createStateRef(currentState)
  const currentId = config.name ?? plainState.id
  const defaultState = currentState
  const compositeName = createName(currentId, parent)

  const storeInstance: ThisStore = {
    graphite: createGraph({
      scope: {state: plainState, oldState: currentState},
      node: [
        step.filter({
          fn: upd => upd !== undefined,
        }),
        step.update({
          store: plainState,
        }),
        step.filter({
          fn(upd, scope) {
            if (upd === scope.oldState) return false
            scope.oldState = upd
            return true
          },
        }),
      ],
    }),
    kind: Kind.store,
    id: plainState.id,
    shortName: currentId,
    defaultConfig: config,
    defaultState,
    plainState,
    subscribers: new Map(),
    compositeName,
  }
  const store: $Shape<Store<State>> = {
    compositeName: storeInstance.compositeName,
    graphite: storeInstance.graphite,
    kind: Kind.store,
    id: plainState.id,
    shortName: currentId,
    setState,
    off: off.bind(null, storeInstance),
    watch: watch.bind(null, storeInstance),
    subscribe: subscribe.bind(null, storeInstance),
    getState: getState.bind(null, storeInstance),
    stateRef: plainState,
  }
  ;(store: any).defaultConfig = config
  ;(store: any).reset = reset.bind(store, storeInstance)
  ;(store: any).on = on.bind(store, storeInstance)
  ;(store: any).defaultState = defaultState
  ;(store: any).map = mapStore.bind(storeFabric, store)
  //$off
  store[$$observable] = observable.bind(null, storeInstance)

  function setState(value) {
    launch(store, value)
  }

  return store
}
