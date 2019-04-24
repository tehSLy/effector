//@flow

import {createEffect} from '..'

test("should return it's own name on effect.getType()", () => {
  expect(createEffect('foo').getType()).toBe('foo')
})

describe('empty name support', () => {
  //eslint-disable-next-line max-len
  test('createEffect() should create effect with string id used as name', () => {
    expect(createEffect().getType()).not.toBe(undefined)
    expect(createEffect().getType()).not.toBe('')
  })
})
