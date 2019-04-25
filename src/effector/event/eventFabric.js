//@flow
import $$observable from 'symbol-observable'

import {
  step,
  Kind,
  stringRefcount,
  createGraph,
  type Unit,
} from 'effector/stdlib'
import type {Effect} from 'effector/effect'
import {launch} from 'effector/kernel'
import {noop, updateHandler} from 'effector/blocks'

import type {Subscription} from '../index.h'
import type {EventConfigPart} from '../config'
import type {Event} from './index.h'
import {createName} from '../compositeName'
import {forward} from './forward'

const nextID = stringRefcount()

export function eventFabric<Payload>({
  name: nameRaw,
  config = {},
}: {
  name?: string,
  config?: EventConfigPart,
} = {}): Event<Payload> {
  const id = nextID()
  const name = nameRaw || id
  const compositeName = createName(name)
  const fullName = compositeName.fullName
  const graphite = createGraph({
    node: [
      step.emit({
        fullName,
      }),
    ],
  })

  //$off
  const instance: Event<Payload> = (payload: Payload) =>
    instance.create(payload)
  //eslint-disable-next-line no-unused-vars
  ;(instance: any).create = launch.bind(null, instance)
  ;(instance: any).kind = Kind.event
  ;(instance: any)[$$observable] = () => instance
  ;(instance: any).id = id
  ;(instance: any).watch = watchEvent.bind(null, instance)
  ;(instance: any).map = mapEvent.bind(null, instance)
  ;(instance: any).filter = filterEvent.bind(null, instance)
  ;(instance: any).prepend = prepend.bind(null, instance)
  ;(instance: any).subscribe = subscribe.bind(null, instance)
  instance.graphite = graphite
  instance.shortName = name
  instance.compositeName = compositeName
  instance.defaultConfig = config

  return instance
}

const subscribe = (event, observer): Subscription =>
  event.watch(payload => observer.next(payload))

const prepend = (event, fn: (_: any) => *) => {
  const contramapped: Event<any> = eventFabric()
  forward({
    from: contramapped,
    to: createGraph({
      child: [event],
      scope: {handler: fn},
      node: [updateHandler],
    }),
  })
  return contramapped
}

declare function mapEvent<A, B>(event: Event<A>, fn: (_: A) => B): Event<B>
declare function mapEvent<A, B>(
  effect: Effect<A, any, any>,
  fn: (_: A) => B,
): Event<B>
function mapEvent<A, B>(event: Event<A> | Effect<A, any, any>, fn: A => B) {
  const mapped = eventFabric()
  forward({
    from: event,
    to: createGraph({
      child: [mapped],
      scope: {handler: fn},
      node: [updateHandler],
    }),
  })
  return mapped
}

function filterEvent<A>(event: Unit, fn: A => boolean): Event<A> {
  const mapped = eventFabric()
  forward({
    from: event,
    to: createGraph({
      scope: {handler: fn},
      child: [mapped],
      node: [
        step.filter({
          fn: (upd, {handler}) => !!handler(upd),
        }),
      ],
    }),
  })
  return mapped
}

function watchEvent<Payload>(
  event: Unit,
  watcher: (payload: Payload) => any,
): Subscription {
  return forward({
    from: event,
    to: createGraph({
      scope: {handler: watcher},
      //prettier-ignore
      node: [
        noop,
        step.run({
          fn: (payload: Payload, {handler}) => handler(
            payload,
          ),
        }),
      ]
    }),
  })
}
