//@flow

import {createEffect} from '..'

test("should return it's own name on effect.shortName", () => {
  expect(createEffect('foo').shortName).toBe('foo')
})

describe('empty name support', () => {
  //eslint-disable-next-line max-len
  test('createEffect() should create effect with string id used as name', () => {
    expect(createEffect().shortName).not.toBe(undefined)
    expect(createEffect().shortName).not.toBe('')
  })
})
