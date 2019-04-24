//@flow

import {createEvent} from '..'

test("should return it's own name on event.getType()", () => {
  expect(createEvent('foo').getType()).toBe('foo')
})

describe('empty name support', () => {
  test('createEvent() should create event with string id used as name', () => {
    expect(createEvent().getType()).not.toBe(undefined)
    expect(createEvent().getType()).not.toBe('')
  })
})
