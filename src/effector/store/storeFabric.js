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
  bind,
  type Unit,
} from 'effector/stdlib'
import {filterChanged, noop} from 'effector/blocks'
import type {Store} from './index.h'
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

  const graphite = createGraph({
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
  })
  const subscribers = new Map()
  //$todo
  const store: $Shape<Store<State>> = {
    compositeName,
    graphite,
    kind: Kind.store,
    id: plainState.id,
    shortName: currentId,
    getState: bind(readRef, plainState),
    stateRef: plainState,
    subscribers,
  }
  ;(store: any).off = bind(off, store)
  ;(store: any).subscribe = bind(subscribe, store)
  ;(store: any).watch = bind(watch, store)
  ;(store: any).defaultState = defaultState
  ;(store: any).setState = bind(launch, store)
  ;(store: any).defaultConfig = config
  ;(store: any).reset = bind(reset, store)
  ;(store: any).on = bind(on, store)
  ;(store: any).map = bind(mapStore, store)
  //$off
  store[$$observable] = bind(observable, store)

  return store
}

const reset = (storeInstance, event: Unit) =>
  on(storeInstance, event, () => storeInstance.defaultState)

function off(storeInstance, event: Event<any>) {
  const currentSubscription = storeInstance.subscribers.get(event)
  if (currentSubscription === undefined) return
  currentSubscription()
  storeInstance.subscribers.delete(event)
}

const on = (storeInstance, from: Unit, handler: Function) => {
  const oldLink = storeInstance.subscribers.get(from)
  if (oldLink) oldLink()
  storeInstance.subscribers.set(
    from,
    forward({
      from,
      to: createGraph({
        scope: {handler, state: storeInstance.stateRef},
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
  return storeInstance
}
function observable(storeInstance) {
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
function watch(storeInstance, eventOrFn: Event<*> | Function, fn?: Function) {
  const message = 'watch requires function handler'
  switch (eventOrFn?.kind) {
    case 'store':
    case 'event':
    case 'effect':
      invariant(typeof fn === 'function', message)
      return eventOrFn.watch(payload =>
        //$todo
        fn(storeInstance.getState(), payload),
      )
    default:
      invariant(typeof eventOrFn === 'function', message)
      return subscribe(storeInstance, eventOrFn)
  }
}
function subscribe(storeInstance, listener: Function) {
  invariant(
    typeof listener === 'function',
    'Expected the listener to be a function',
  )
  let lastCall = storeInstance.getState()

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
