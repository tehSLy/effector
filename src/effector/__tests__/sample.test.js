//@flow

import {sample} from '../'

import {createEvent} from 'effector/event'
import {createStore} from 'effector/store'
import {createEffect} from 'effector/effect'

describe('sample', () => {
  test('store', () => {
    const spy = jest.fn()
    const inc = createEvent('inc')
    const dec = createEvent('dec')
    const stop = createEvent('stop')

    const s1 = createStore(0)
    const s2 = sample(s1, stop)

    s2.watch(value => spy(value))

    s1.on(inc, n => n + 1).on(dec, n => n - 1)

    inc()
    dec()
    inc()
    inc()

    stop()

    expect(spy.mock.calls).toEqual([[0], [2]])
    expect(spy).toHaveBeenCalledTimes(2)
  })

  test('event', () => {
    const spy = jest.fn()
    const data = createEvent('data')
    const stop = createEvent('stop')

    const lastData = sample(data, stop)

    lastData.watch(value => spy(value))

    data({foo: 'bar'})
    data(true)
    data(false)
    data({x: 'baz'})

    stop()

    expect(spy.mock.calls).toEqual([[{x: 'baz'}]])
    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('effect', () => {
    const spy = jest.fn()
    const data = createEffect('data', {
      handler() {
        return 'resolved'
      },
    })
    const stop = createEvent('stop')

    const lastData = sample(data, stop)

    lastData.watch(value => spy(value))

    data({foo: 'bar'})
    data(true)
    data(false)
    data({x: 'baz'})

    stop()

    expect(spy.mock.calls).toEqual([[{x: 'baz'}]])
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
