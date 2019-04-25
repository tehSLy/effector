//@flow

import {combine, createStore} from 'effector'

//$todo
const readFullName = unit => unit.compositeName?.fullName

describe('raw config', () => {
  it.skip('should set name', () => {
    const foo = createStore(0)
    expect(readFullName(foo)).toBe('foo')
    const bar = createStore(0)
    expect(readFullName(bar)).toBe('bar')
    const e = combine(foo, bar, (a, b) => ({a, b}))
    expect(readFullName(e)).toBe('combine(foo, bar) → *')
  })

  it.skip('should prefer original name', () => {
    const foo = createStore(0, {name: 'bar'})
    expect(readFullName(foo)).toBe('bar')
    const bar = createStore(0, {name: 'foo'})
    expect(readFullName(bar)).toBe('foo')
  })

  it('should ignore wrong config', () => {
    const a = createStore('h', {})
    //$off
    const b = createStore('h', 23020)
    const config = {option: 0}
    const c = createStore(null, config)
    expect(readFullName(a)).toBe('a')
    expect(readFullName(b)).toBe('b')
    expect(readFullName(c)).toBe('c')

    const d = createStore('h', {})
    //$off
    const e = createStore('h', 23020)
    const f = createStore(null, config)
    //$off
    const g = createStore('h', 'meme')
    //$off
    const h = createStore('h', null)
    //$off
    const j = createStore('h', true)
    //$off
    const k = createStore('h', false)
    expect(readFullName(d)).toBe('d')
    expect(readFullName(e)).toBe('e')
    expect(readFullName(f)).toBe('f')
  })
})
