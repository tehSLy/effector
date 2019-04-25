//@flow

import {createEvent} from '..'

test("should return it's own name on event.shortName", () => {
  expect(createEvent('foo').shortName).toBe('foo')
})

describe('empty name support', () => {
  test('createEvent() should create event with string id used as name', () => {
    expect(createEvent().shortName).not.toBe(undefined)
    expect(createEvent().shortName).not.toBe('')
  })
})
