//@flow
import $$observable from 'symbol-observable'

import invariant from 'invariant'
import {
  step,
  createGraph,
  Kind,
  createStateRef,
  readRef,
  writeRef,
} from 'effector/stdlib'
import {filterChanged, noop} from 'effector/blocks'
import type {Store, ThisStore} from './index.h'
import type {Subscriber} from '../index.h'
import type {StoreConfigPart as ConfigPart} from '../config'
import {createName, type CompositeName} from '../compositeName'

import {launch} from 'effector/kernel'
import {forward, type Event} from 'effector/event'

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
    off: off.bind(null, storeInstance),
    watch: watch.bind(null, storeInstance),
    subscribe: subscribe.bind(null, storeInstance),
    getState: getState.bind(null, storeInstance),
    stateRef: plainState,
  }
  ;(store: any).setState = launch.bind(null, store)
  ;(store: any).defaultConfig = config
  ;(store: any).reset = reset.bind(store, storeInstance)
  ;(store: any).on = on.bind(store, storeInstance)
  ;(store: any).defaultState = defaultState
  ;(store: any).map = mapStore.bind(null, store)
  //$off
  store[$$observable] = observable.bind(null, storeInstance)

  return store
}

function reset(storeInstance: ThisStore, event: Event<any>) {
  return on.call(this, storeInstance, event, () => storeInstance.defaultState)
}
function getState(storeInstance: ThisStore) {
  return readRef(storeInstance.plainState)
}
function off(storeInstance: ThisStore, event: Event<any>) {
  const currentSubscription = storeInstance.subscribers.get(event)
  if (currentSubscription === undefined) return
  currentSubscription()
  storeInstance.subscribers.delete(event)
}

function on(storeInstance: ThisStore, event: any, handler: Function) {
  const from: Event<any> = event
  const oldLink = storeInstance.subscribers.get(from)
  if (oldLink) oldLink()
  storeInstance.subscribers.set(
    from,
    forward({
      from,
      to: createGraph({
        scope: {handler, state: storeInstance.plainState},
        child: [storeInstance],
        //prettier-ignore
        node: [
          step.compute({
            fn(upd, {handler, state}) {
              const result = handler(
                readRef(state),
                upd,
              )
              if (result === undefined) return
              return writeRef(state, result)
            },
          }),
        ]
      }),
    }),
  )
  return this
}
function observable(storeInstance: ThisStore) {
  const result = {
    subscribe(observer: Subscriber<any>) {
      invariant(
        typeof observer === 'object' && observer !== null,
        'Expected the observer to be an object.',
      )

      function observeState(state) {
        if (observer.next) {
          observer.next(state)
        }
      }
      return subscribe(storeInstance, observeState)
    },
  }
  //$off
  result[$$observable] = function() {
    return this
  }
  return result
}
function watch(
  storeInstance: ThisStore,
  eventOrFn: Event<*> | Function,
  fn?: Function,
) {
  const message = 'watch requires function handler'
  switch (eventOrFn?.kind) {
    case 'store':
    case 'event':
    case 'effect':
      invariant(typeof fn === 'function', message)
      return eventOrFn.watch(payload =>
        //$todo
        fn(getState(storeInstance), payload),
      )
    default:
      invariant(typeof eventOrFn === 'function', message)
      return subscribe(storeInstance, eventOrFn)
  }
}
function subscribe(storeInstance: ThisStore, listener: Function) {
  invariant(
    typeof listener === 'function',
    'Expected the listener to be a function',
  )
  let lastCall = getState(storeInstance)

  try {
    listener(lastCall)
  } catch (err) {
    console.error(err)
  }
  return forward({
    from: storeInstance,
    to: createGraph({
      scope: {listener},
      node: [
        noop,
        step.run({
          fn(args, {listener}) {
            //TODO seems pointless
            if (args === lastCall) {
              return
            }
            lastCall = args
            listener(args)
          },
        }),
      ],
    }),
  })
}

function mapStore<A, B>(
  store: Store<A>,
  fn: (state: A, lastState?: B) => B,
  firstState?: B,
): Store<B> {
  let lastResult
  try {
    lastResult = fn(store.getState(), firstState)
  } catch (err) {
    console.error(err)
  }
  const innerStore: Store<any> = storeFabric({
    currentState: lastResult,
  })
  forward({
    from: store,
    to: createGraph({
      child: [innerStore],
      scope: {handler: fn, state: innerStore.stateRef},
      node: [
        step.compute({
          fn: (upd, {state, handler}) => handler(upd, readRef(state)),
        }),
        filterChanged,
      ],
    }),
  })
  return innerStore
}
