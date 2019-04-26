//@flow
import $$observable from 'symbol-observable'

import invariant from 'invariant'
import {is} from 'effector/validate'
import {
  step,
  createGraph,
  Kind,
  createStateRef,
  readRef,
  writeRef,
  bind,
  initialRun,
  type Unit,
} from 'effector/stdlib'
import {filterChanged, noop} from 'effector/blocks'
import type {Store} from './index.h'
import type {Subscriber} from '../index.h'
import type {StoreConfigPart as ConfigPart} from '../config'

import {launch} from 'effector/kernel'
import {forward} from 'effector/event'

export function storeFabric<State>(props: {
  currentState: State,
  config?: ConfigPart,
}): Store<State> {
  const {currentState, config = {}} = props
  const plainState = createStateRef(currentState)
  const currentId = config.name ?? plainState.id

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

  const store: $Shape<Store<State>> = {
    graphite,
    kind: Kind.store,
    id: plainState.id,
    shortName: currentId,
    getState: bind(readRef, plainState),
    stateRef: plainState,
    subscribers: new Map(),
    defaultState: currentState,
    defaultConfig: config,
  }
  ;(store: any).off = bind(off, store)
  ;(store: any).subscribe = bind(subscribe, store)
  ;(store: any).watch = bind(watch, store)
  ;(store: any).setState = bind(launch, store)
  ;(store: any).reset = bind(reset, store)
  ;(store: any).on = bind(on, store)
  ;(store: any).map = bind(mapStore, store)
  ;(store: any)[$$observable] = bind(observable, store)

  return store
}

const reset = (storeInstance, event: Unit) =>
  on(storeInstance, event, () => storeInstance.defaultState)

const off = ({subscribers}, event: Unit) => {
  const currentSubscription = subscribers.get(event)
  if (currentSubscription === undefined) return
  currentSubscription()
  subscribers.delete(event)
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
const observable = storeInstance => {
  const result = {
    subscribe(observer: Subscriber<any>) {
      invariant(
        typeof observer === 'object' && observer !== null,
        'Expected the observer to be an object.',
      )
      return subscribe(storeInstance, state => {
        if (observer.next) {
          observer.next(state)
        }
      })
    },
  }
  //$off
  result[$$observable] = function() {
    return this
  }
  return result
}
function watch(storeInstance, eventOrFn: Unit | Function, fn?: Function) {
  const message = 'watch requires function handler'
  if (is.unit(eventOrFn)) {
    invariant(typeof fn === 'function', message)
    //TODO we need to push update immediately in case of store, aren't we?
    //note that in another watch case it already implemented
    return forward({
      from: (eventOrFn: any),
      to: createGraph({
        scope: {handler: fn, state: storeInstance.stateRef},
        node: [
          noop,
          step.run({
            fn: (upd, {handler, state}) => handler(readRef(state), upd),
          }),
        ],
      }),
    })
  }
  invariant(typeof eventOrFn === 'function', message)
  return subscribe(storeInstance, eventOrFn)
}
function subscribe(storeInstance, listener: Function) {
  invariant(
    typeof listener === 'function',
    'Expected the listener to be a function',
  )
  let lastCall = storeInstance.getState()
  initialRun(() => listener(lastCall))
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
  const innerStore: Store<any> = storeFabric({
    currentState: initialRun(() => fn(store.getState(), firstState)),
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
