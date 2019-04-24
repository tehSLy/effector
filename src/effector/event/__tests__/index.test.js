//@flow

import {from} from 'most'
import {createEvent, type Event} from '..'

import {show} from 'effector/fixtures/showstep'

describe('symbol-observable support', () => {
  test('most.from(event) //stream of events', () => {
    const spy = jest.fn()
    expect(() => {
      from(createEvent(''))
    }).not.toThrow()
    const ev1 = createEvent('ev1')
    const ev2 = createEvent('ev2')
    const ev1$ = from(ev1)
    ev1$.observe(spy)
    ev1(0)
    ev1(1)
    ev1(2)
    ev2('should ignore')
    expect(spy).toHaveBeenCalledTimes(3)

    expect(spy.mock.calls).toEqual([[0], [1], [2]])
  })
})

test('event.watch(fn)', () => {
  const spy = jest.fn()
  const click = createEvent('click')
  click.watch(spy)
  click()
  click(1)
  click(2)
  expect(spy).toHaveBeenCalledTimes(3)
  expect(spy.mock.calls).toEqual([[undefined], [1], [2]])
})

test('event.prepend(fn)', () => {
  const spy = jest.fn()
  const click = createEvent('click')
  const preclick = click.prepend(([n]) => n)
  click.watch(spy)
  preclick([])
  preclick([1])
  preclick([2])

  expect(spy).toHaveBeenCalledTimes(3)
  expect(spy.mock.calls).toEqual([[undefined], [1], [2]])
})

test('event.map(fn)', () => {
  const spy = jest.fn()
  const click = createEvent('click')
  const postclick = click.map(n => [n])
  postclick.watch(spy)
  click()
  click(1)
  click(2)
  expect(spy).toHaveBeenCalledTimes(3)
  expect(spy.mock.calls).toEqual([[[undefined]], [[1]], [[2]]])
})

test('event.filter should infer type', () => {
  const spy = jest.fn()
  const num: Event<number | '-1'> = createEvent('number')

  const evenNum = num.filter(n => {
    if (n !== '-1') return n
  })

  evenNum.watch(spy)

  num(0)
  num('-1')
  num(2)
  num('-1')
  num(4)
  ;(evenNum: Event<number>) //Should not fail

  expect(spy.mock.calls).toEqual([[0], [2], [4]])
})

test('event.filter should drop undefined values', () => {
  const spy = jest.fn()
  const num: Event<number> = createEvent('number')
  const evenNum = num.filter(n => {
    if (n % 2 === 0) return n * 2
  })

  evenNum.watch(spy)

  num(0)
  num(1)
  num(2)
  num(3)
  num(4)

  expect(spy.mock.calls).toEqual([[0], [4], [8]])

  expect(show(num.graphite)).toMatchSnapshot('num event graph')
  expect(show(evenNum.graphite)).toMatchSnapshot('evenNum event graph')
})
