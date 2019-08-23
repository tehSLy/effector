#### Replace `store.on(event, (_, v) => v` with [`restore`](api/effector/restore)!

Consider:
```js
//source
const setValue = createEvent();
const reset = createEvent();
const $store = createStore(0)
	.on(setValue, (_, value) => value)
	.reset(reset);

//with `restore`
const setValue = createEvent();
const $store = restore(setValue, 0)// yet this is still a store
	.reset(reset); // you may continue to apply reducers

```

This trick works with effects aswell, but in sliughtly other way:
```js
const effect = createEffect({handler: async (n: number) => `Called with: ${n}`}); // Just an effect, returning Promise<string>
const store = restore(effect, "initial"); // => Store<string>
// Yet, effect.done payload has type, shaped like this
// Payload {
// 	result: string;
// 	params: number;
// } 
// it will `infer` type from the type, which effect returns

store.watch(console.log); // => initial

effect(42); // => Called with: 42
```

#### Use .map methods!
If there is a case, when data from one node depends on data from the other, don't just duplicate stores, or events.

Consider:

```js
const getUserFromApi = createEffect({handler: async () => ({
	user: {
		name: "John",
		id: 12
		roles: ["admin", "other-role"]
	}
})})

//using several stores
const $user = createStore(null)
	.on(getUserFromApi.done, (_, {result}) => result.user)

const $roles = createStore([])
	.on(getUserFromApi.done, (_, {result}) => result.user.roles)

const $name = createStore("")
	.on(getUserFromApi.done, (_, {result}) => result.user.name)


//using map
//approach #1
const $result = restore(getUserFromApi, null);

const $user = $result.map((result) => result ? result.user : null);

const $roles = restore
```