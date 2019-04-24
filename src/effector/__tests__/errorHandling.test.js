//@flow

import {createStore, createEvent, launch} from 'effector'

it('handle store watcher exceptions', () => {
  const store = createStore(null)

  store.watch(() => {
    throw Error('[expected]')
  })
  launch(store, {})
})

it('handle event watcher exceptions', () => {
  const event = createEvent()

  event.watch(() => {
    throw Error('[expected]')
  })
  event()
})
