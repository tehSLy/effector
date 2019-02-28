export type kind =
  | 'store'
  | 'event'
  | 'effect'

declare export const Kind: {
  readonly store: 'store',
  readonly event: 'event',
  readonly effect: 'effect',
}

export type Subscriber<A> = {
  next(value: A): void
  // error(err: Error): void,
  //complete(): void,
}

export type Subscription = {
  (): void
  unsubscribe(): void
}

export interface Unit<T> {
  readonly kind: kind;
}

export interface ComputedEvent<Payload> extends Unit<Payload> {
  watch(watcher: (payload: Payload) => any): Subscription
  map<T>(fn: (_: Payload) => T): ComputedEvent<T>
  filter<T>(fn: (_: Payload) => T | void): ComputedEvent<T>
  prepend<Before>(fn: (_: Before) => Payload): Event<Before>
  subscribe(subscriber: Subscriber<Payload>): Subscription
  getType(): string
}

export interface Event<Payload> extends Unit<Payload> {
  (payload: Payload): Payload
  watch(watcher: (payload: Payload) => any): Subscription
  map<T>(fn: (_: Payload) => T): ComputedEvent<T>
  filter<T>(fn: (_: Payload) => T | void): ComputedEvent<T>
  prepend<Before>(fn: (_: Before) => Payload): Event<Before>
  subscribe(subscriber: Subscriber<Payload>): Subscription
  getType(): string
}
export type EventLike<Payload> = ComputedEvent<Payload> | Event<Payload>

export interface Future<Params, Done, Fail> extends Promise<Done> {
  args: Params
  anyway(): Promise<void>
  cache(): Done | void
}

export interface Effect<Params, Done, Fail = Error> extends Unit<Params> {
  (payload: Params): Future<Params, Done, Fail>
  done: ComputedEvent<{params: Params; result: Done}>
  fail: ComputedEvent<{params: Params; error: Fail}>
  use: {
    (asyncFunction: (params: Params) => Promise<Done> | Done): Effect<
      Params,
      Done,
      Fail
    >
    getCurrent(): (params: Params) => Promise<Done>
  }
  watch(watcher: (payload: Params) => any): Subscription
  prepend<Before>(fn: (_: Before) => Params): Event<Before>
  subscribe(subscriber: Subscriber<Params>): Subscription
  getType(): string
}

export class ComputedStore<State> implements Unit<State> {
  readonly kind: kind;
  getState(): State;
  map<T>(fn: (_: State, lastState?: T) => T, _: void): ComputedStore<T>;
  map<T>(fn: (_: State, lastState: T) => T, firstState: T): ComputedStore<T>;
  subscribe(listener: any): Subscription;
  watch<E>(
    watcher: (state: State, payload: E, type: string) => any,
    __: void,
  ): Subscription;
  watch<E>(
    trigger: Unit<E>,
    watcher: (state: State, payload: E, type: string) => any,
  ): Subscription;
  thru<U>(fn: (store: this) => U): U;
  shortName: string;
  defaultState: State;
}

export class Store<State> implements Unit<State> {
  readonly kind: kind
  reset(trigger: Unit<any>): this
  getState(): State
  map<T>(fn: (_: State, lastState?: T) => T): ComputedStore<T>
  map<T>(fn: (_: State, lastState: T) => T, firstState: T): ComputedStore<T>
  on<E>(
    trigger: Unit<E>,
    handler: (state: State, payload: E) => State | void,
  ): this
  off(trigger: Unit<any>): void
  subscribe(listener: any): Subscription
  watch<E>(
    watcher: (state: State, payload: E, type: string) => any,
  ): Subscription
  watch<E>(
    trigger: Unit<E>,
    watcher: (state: State, payload: E, type: string) => any,
  ): Subscription
  thru<U>(fn: (store: this) => U): U
  shortName: string
  defaultState: State
}
export type StoreLike<State> = ComputedStore<State> | Store<State>

export class Domain {
  onCreateEvent(hook: (newEvent: Event<unknown>) => any): Subscription
  onCreateEffect(
    hook: (newEffect: Effect<unknown, unknown, unknown>) => any,
  ): Subscription
  onCreateStore(hook: (newStore: Store<unknown>) => any): Subscription
  onCreateDomain(hook: (newDomain: Domain) => any): Subscription
  event<Payload>(name?: string): Event<Payload>
  effect<Params, Done, Fail>(name?: string): Effect<Params, Done, Fail>
  domain(name?: string): Domain
  store<State>(defaultState: State): Store<State>
  getType(): string
}

export function forward<T>(opts: {
  from: Unit<T>
  to: Unit<T>
}): Subscription

export function createEvent<Payload>(eventName?: string): Event<Payload>

export function createEffect<Params, Done, Fail>(
  effectName?: string,
  config?: {
  handler?: (params: Params) => Promise<Done> | Done
  },
): Effect<Params, Done, Fail>

export function createStore<State>(defaultState: State): Store<State>
export function setStoreName<State>(store: Store<State>, name: string): void

export function createStoreObject<State>(
  defaultState: State,
): ComputedStore<{[K in keyof State]: State[K] extends StoreLike<infer U> ? U : State[K]}>
export function createApi<
  S,
  Api extends {[name: string]: (store: S, e: any) => S}
>(
  store: Store<S>,
  api: Api,
): {
  [K in keyof Api]: Api[K] extends (store: S, e: infer E) => S ? Event<E> : any
}

export function extract<State, NextState>(
  obj: StoreLike<State>,
  extractor: (_: State) => NextState,
): ComputedStore<NextState>
export function restoreObject<State extends {[key: string]: StoreLike<any> | any}>(
  state: State,
): {
  [K in keyof State]: State[K] extends Store<infer S> ? Store<S> : State[K] extends ComputedStore<infer S> ? ComputedStore<S> : State[K]
}
export function restoreEffect<Done>(
  effect: Effect<any, Done, any>,
  defaultState: Done,
): ComputedStore<Done>
export function restoreEvent<Payload>(event: Event<Payload>, defaultState: Payload): ComputedStore<Payload>
export function restore<Done>(
  effect: Effect<any, Done, any>,
  defaultState: Done,
): ComputedStore<Done>
export function restore<Payload>(event: Event<Payload>, defaultState: Payload): ComputedStore<Payload>
export function restore<State extends {[key: string]: StoreLike<any> | any}>(
  state: State,
): {
  [K in keyof State]: State[K] extends Store<infer S> ? Store<S> : State[K] extends ComputedStore<infer S> ? ComputedStore<S> : State[K]
}

export function createDomain(domainName?: string): Domain

export function combine<R>(fn: () => R): ComputedStore<R>
export function combine<A, R>(a: Store<A>, fn: (a: A) => R): ComputedStore<R>
export function combine<A, B, R>(
  a: StoreLike<A>,
  b: StoreLike<B>,
  fn: (a: A, b: B) => R,
): ComputedStore<R>
export function combine<A, B, C, R>(
  a: StoreLike<A>,
  b: StoreLike<B>,
  c: StoreLike<C>,
  fn: (a: A, b: B, c: C) => R,
): ComputedStore<R>
export function combine<A, B, C, D, R>(
  a: StoreLike<A>,
  b: StoreLike<B>,
  c: StoreLike<C>,
  d: StoreLike<D>,
  fn: (a: A, b: B, c: C, d: D) => R,
): ComputedStore<R>
export function combine<A, B, C, D, E, R>(
  a: StoreLike<A>,
  b: StoreLike<B>,
  c: StoreLike<C>,
  d: StoreLike<D>,
  e: StoreLike<E>,
  fn: (a: A, b: B, c: C, d: D, e: E) => R,
): ComputedStore<R>
export function combine<A, B, C, D, E, F, R>(
  a: StoreLike<A>,
  b: StoreLike<B>,
  c: StoreLike<C>,
  d: StoreLike<D>,
  e: StoreLike<E>,
  f: StoreLike<F>,
  fn: (a: A, b: B, c: C, d: D, e: E, f: F) => R,
): ComputedStore<R>
export function combine<A, B, C, D, E, F, G, R>(
  a: StoreLike<A>,
  b: StoreLike<B>,
  c: StoreLike<C>,
  d: StoreLike<D>,
  e: StoreLike<E>,
  f: StoreLike<F>,
  g: StoreLike<G>,
  fn: (a: A, b: B, c: C, d: D, e: E, f: F, g: G) => R,
): ComputedStore<R>
export function combine<A, B, C, D, E, F, G, H, R>(
  a: StoreLike<A>,
  b: StoreLike<B>,
  c: StoreLike<C>,
  d: StoreLike<D>,
  e: StoreLike<E>,
  f: StoreLike<F>,
  g: StoreLike<G>,
  h: StoreLike<H>,
  fn: (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H) => R,
): ComputedStore<R>
export function combine<A, B, C, D, E, F, G, H, I, R>(
  a: StoreLike<A>,
  b: StoreLike<B>,
  c: StoreLike<C>,
  d: StoreLike<D>,
  e: StoreLike<E>,
  f: StoreLike<F>,
  g: StoreLike<G>,
  h: StoreLike<H>,
  i: StoreLike<I>,
  fn: (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I) => R,
): ComputedStore<R>
export function combine<A, B, C, D, E, F, G, H, I, J, R>(
  a: StoreLike<A>,
  b: StoreLike<B>,
  c: StoreLike<C>,
  d: StoreLike<D>,
  e: StoreLike<E>,
  f: StoreLike<F>,
  g: StoreLike<G>,
  h: StoreLike<H>,
  i: StoreLike<I>,
  j: StoreLike<J>,
  fn: (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I, j: J) => R,
): ComputedStore<R>
export function combine<A, B, C, D, E, F, G, H, I, J, K, R>(
  a: StoreLike<A>,
  b: StoreLike<B>,
  c: StoreLike<C>,
  d: StoreLike<D>,
  e: StoreLike<E>,
  f: StoreLike<F>,
  g: StoreLike<G>,
  h: StoreLike<H>,
  i: StoreLike<I>,
  j: StoreLike<J>,
  k: StoreLike<K>,
  fn: (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I, j: J, k: K) => R,
): ComputedStore<R>
