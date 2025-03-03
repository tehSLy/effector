---
id: sample
title: sample
hide_title: true
---

# `sample(sourceStore, clockEvent, fn)`
Overall this method can be used in order to link two nodes, resulting the third one, which will fire only upon `clock` node trigger.

Passes current `sourceStore`'s state and `clockEvent`'s value to `fn` handler. Quite a common case when you need to handle some event with some store's state. Instead of using `store.getState()`, in body of effect, which may cause race conditions and inconsistency of state at the moment of effect's handler invocation, it is more appropriate to use `sample` method as described below.

Returned Unit may be observed (via `watch`), since it's valid graph node.

#### Arguments

1. `sourceStore` _(Store)_: Source event
2. `clockEvent` _(Event)_: Clock(Trigger) event
3. `fn`? _((source, clock) => result)_:  Optional combinator function, should be **pure**. Since, this handler is supposed to organize data flow, you should avoid declaring side-effects here. It's more appropriate to place it in `watch` method for sampled node;

#### Returns

([_`Event`_](Event.md)) - Event, which fires upon clock is triggered

#### Example 1

```javascript
import {createStore, createEvent, sample} from "effector";

const store = createStore('hello zerobias');
const event = createEvent();

const sampled = sample(store, event);
sampled.watch(console.log);

event() // => hello zerobias
```
[try it](https://share.effector.dev/IMXnU270)

#### Example 2

```javascript
import {createStore, createEvent, sample} from "effector"

const login = createStore('peter')
const sendMessage = createEvent()

const fullMessage = sample(
  login,
  sendMessage,
  (login, text) => ({login, text}),
)

fullMessage.watch(({login, text}) => {
   console.log(`[${login}]: ${text}`)
})

sendMessage('hello')
// => [peter]: hello
sendMessage('how r u?')
// => [peter]: how r u?

```
[try it](https://share.effector.dev/0ZP1xn8d)


# `sample(sourceEvent, clockEvent, fn)`

Passes last `sourceEvent` invocation argument value and `clockEvent` value to `fn` handler.

#### Arguments

1. `sourceEvent` _(Event)_: Source event
2. `clockEvent` _(Event)_: Clock(Trigger) event
3. `fn`? _((source, clock) => result)_: Optional combinator function, should be **pure**

#### Returns

([_`Event`_](Event.md)) - Event, which fires upon clock is triggered

#### Example

```js
import {createEvent, sample} from "effector"

const event1 = createEvent();
const event2 = createEvent();

const sampled = sample(event1, event2, (a, b) => `${a} ${b}`);
sampled.watch(console.log);

event1("Hello");
event2("World"); // => Hello World
event2("effector!"); // => Hello effector!

sampled("Can be invoked too!"); // => Can be invoked too!
```
[try it](https://share.effector.dev/vXKWDhwL)

# `sample(event, store, fn)`

Passes last `event` invocation argument value and `store`'s updated state to `fn` handler.

#### Arguments

1. `event` _(Event)_: Source event
2. `store` _(Store)_: Triggers sampled unit upon store update
3. `fn`? _((source, clock) => result)_: Optional combinator function, should be **pure**

#### Returns

([_`Event`_](Event.md)) - Event, which fires upon clock is triggered

#### Example

```js
import {createEvent, createStore, sample} from "effector"

const event = createEvent();
const inc = createEvent();
const count = createStore(0)
  .on(inc, (state) => state + 1);

const sampled = sample(event, count, (c, i) => `Current count is ${i}, last event invocation: ${c}`);
sampled.watch(console.log);

inc() // => nothing

event("foo");
inc() // => Current count is 2, last event invocation: foo

event("bar");
inc(); // => Current count is 3, last event invocation: bar
```
[try it](https://share.effector.dev/L4nbGjxM)

# `sample(sourceStore, clockStore, fn)`

Passes last `sourceStore`'s current state and `clockStore`'s updated state to `fn` handler, upon `clockStore`'s update.

#### Arguments

1. `sourceStore` _(Store)_: Source store
2. `clockStore` _(Store)_: Triggers sampled unit upon store update
3. `fn`? _((source, clock) => result)_: Optional combinator function, should be **pure**

#### Returns

([_`Store`_](Store.md)) - Store, which updates upon clock update

#### Example

```js
import {createEvent, createStore, sample} from "effector";

const inc = createEvent();
const setName = createEvent();

const name = createStore("John")
  .on(setName, (_, v) => v);

const clock = createStore(0)
  .on(inc, (i) => i + 1);

const sampled = sample(name, clock, (name, i) => `${name} has ${i} coins`);
sampled.watch(console.log);
 // => John has 0 coins (initial store update triggered sampled store)

setName("Doe");
inc(); // => Doe has 1 coins
```
[try it](https://share.effector.dev/h3zED3yW)

# `sample({source, clock, fn, greedy?, target?})`

Object-like arguments passing, working exactly the same as examples above do.

`greedy` modifier defines, whether sampler will wait of  resolving calculation result, and will batch all updates, resulting only one trigger, either will be triggered upon every linked node invocation, e.g. if `greedy` is `true`, `sampler` will fire, upon trigger of every node, linked to clock, whereas `non-greedy sampler(greedy: false)` will fire upon the last linked node trigger.

`target` - can contain Unit, which accepts payload - returned by `fn`. If target passed, result will be the target itself. In case, target not passed, it's created "under the hood" and being returned as result of the function.

#### Arguments

1. `params` _(Object)_: Configuration object

#### Returns

([_`Event`_](Event.md)|[_`Store`_](Store.md)) - Unit, which fires/updates upon `clock` is trigged

#### Example 1
```js
import {sample, createStore, createEffect, createEvent} from 'effector'

const $user = createStore({name: 'john', password: 'doe'})

const signIn = createEffect({handler: console.log})
const submitForm = createEvent()

const submitted = sample({
  source: $user,
  clock: submitForm,
  fn: (user, params) => ({user, params}),
  target: signIn,
})

console.log(submitted === signIn) // units are equal

submitForm('foo')
```
[try it](https://share.effector.dev/OPajzRNF)




#### Example 2
```js
import {createEvent, createStore, sample} from "effector"

const clickButton = createEvent()
const closeModal = clickButton.map(() => 'close modal')

const lastEvent = createStore(null)
  .on(clickButton, (_, data) => data)
  .on(closeModal, () => 'modal')

lastEvent.updates.watch(data => {
  // here we need everything
  //console.log(`sending important analytics event: ${data}`)
})

lastEvent.updates.watch(data => {
  //here we need only final value
  //console.log(`render <div class="yourstatus">${data}</div>`)
})

const analyticReportsEnabled = createStore(false)

const commonSampling = sample({
  source: analyticReportsEnabled,
  clock: merge([clickButton, closeModal]),
  fn: (isEnabled, data) => ({isEnabled, data}),
})

const greedySampling = sample({
  source: analyticReportsEnabled,
  clock: merge([clickButton, closeModal]),
  fn: (isEnabled, data) => ({isEnabled, data}),
  greedy: true,
})

commonSampling.watch(data => console.log('non greedy update', data))
greedySampling.watch(data => console.log('greedy update', data))

clickButton('click A')
clickButton('click B')

```
[try it](https://share.effector.dev/yI70z0nd)


