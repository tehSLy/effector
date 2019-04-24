//@flow

import {
  createApi,
  createEvent,
  createStore,
  type Effect,
  type Event,
  type Store,
} from 'effector'

interface PreventableEvent {
  preventDefault(): void;
}

type SpreadProps<A, B> = $Exact<{
  ...$Call<(empty => {||}) & (<V>(V) => $Exact<V>), A>,
  ...$Call<(empty => {||}) & (<V>(V) => $Exact<V>), B>,
}>

declare export function createFormHandler<T: EventTarget>(
  e: Event<string>,
): Event<interface {currentTarget: T}>
// eslint-disable-next-line no-redeclare
declare export function createFormHandler<T: EventTarget>(
  e: Event<boolean>,
): Event<interface {currentTarget: T}>
// eslint-disable-next-line no-redeclare
declare export function createFormHandler<T: EventTarget>(
  e: Event<number>,
): Event<interface {currentTarget: T}>
// eslint-disable-next-line no-redeclare
export function createFormHandler<
  T: EventTarget & {type: string, value: any, checked: boolean},
>(e: Event<any>): Event<interface {currentTarget: T}> {
  return e.prepend(e => {
    let parsed
    const {type, value, checked} = e.currentTarget
    if (/number|range/.test(type)) {
      return (parsed = parseFloat(value)), isNaN(parsed) ? '' : parsed
    } else {
      return /checkbox/.test(type) ? checked : value
    }
  })
}

export type FormApi<
  Values: {[key: string]: any},
  Errors: {[key: string]: any},
> = {
  values: Store<Values>,
  errors: Store<Errors>,
  isValid: Store<boolean>,
  submitted: Store<boolean>,
  loading: Store<boolean>,
  handleSubmit: Event<void | PreventableEvent>,
  reset: Event<void>,
  handle: $ObjMap<Values, <V>(V) => Event<interface {currentTarget: V}>>,
  api: $ObjMap<Values, <V>(V) => Event<V>>,
}

// TODO: split fields into stores
// export function createFormValue<State>(name: string, defaultState: State) {
//   const value = createStore<State>(defaultState)
//   const update = createEvent<State>(`update ${name}`)
//   value.on(update, (_, p) => p)
//   return {value, update}
// }

export function createFormApi<
  Form: {[key: string]: any},
  External: {[key: string]: any},
  Errors: {[key: string]: any},
  Data,
  Error,
>({
  fields,
  external,
  submitEvent,
  submitEffect,
  validate,
  initialValues,
  resetOnSubmit = true,
}: {
  fields: Form,
  validate?: (
    values: SpreadProps<Form, External>,
    data: {result?: Data, error?: Error},
  ) => Errors,
  external?: Store<External>,
  submitEvent?: Event<SpreadProps<Form, External>>,
  submitEffect?: Effect<SpreadProps<Form, External>, Data, Error>,
  initialValues?: Store<?Form> | Store<Form>,
  resetOnSubmit?: boolean,
}): FormApi<Form, Errors> {
  let initialValuesUnwatch = () => {}

  const form = {}
  const reducers = {}

  const handleSubmit = createEvent('handle submit')
  const values = createStore(fields, {name: 'values'})
  const errors = createStore(({}: any), {name: 'errors'})
  const isValid = errors.map(errors => Object.keys(errors).length === 0)
  const submitted = createStore(false, {name: 'submitted'})
  const loading = createStore(false, {name: 'loading'})

  form.values = values
  form.submitted = submitted
  form.loading = loading
  form.handle = {}

  for (const key in fields) {
    reducers[key] = (state, field) => ({...state, [key]: field})
  }

  reducers.reset = (): Form => (values: any).defaultState
  reducers.set = (_: Form, payload: Form): Form => payload

  const {reset, set, ...api} = createApi(values, reducers)

  values.watch(handleSubmit, (state: Form, e?: PreventableEvent) => {
    if (e) e.preventDefault()
    const externalState = external ? external.getState() : {}
    if (submitEffect) {
      submitEffect({...state, ...externalState})
    } else if (submitEvent) {
      submitEvent({...state, ...externalState})
    }
  })

  errors.reset(reset)
  if (validate) {
    if (submitEffect) {
      errors
        .on(submitEffect.done, (_, {params, result}) =>
          validate(params, {result}),
        )
        .on(submitEffect.fail, (_, {params, error}) =>
          validate(params, {error}),
        )
    } else if (submitEvent) {
      errors.on(submitEvent, (_, payload) => validate(payload, {}))
    }
  }
  if (submitEffect) {
    loading
      .on(submitEffect, () => true)
      .on(submitEffect.done, () => false)
      .on(submitEffect.fail, () => false)
    submitted
      .on(submitEffect.done, () => true)
      .on(submitEffect.fail, () => false)
  } else if (submitEvent) {
    submitted.on(submitEvent, () => true)
  }

  submitted.on(reset, () => false)
  submitted.watch(bool => {
    if (bool && resetOnSubmit) reset()
  })
  if (initialValues) {
    initialValuesUnwatch = initialValues.watch(values => {
      if (values) {
        set(values)
      }
    })
  }

  form.isValid = isValid
  form.errors = errors
  form.handleSubmit = handleSubmit
  form.reset = reset
  form.api = api

  for (const method in api) {
    api[method].watch(() => initialValuesUnwatch())
    form.handle[method] = createFormHandler(api[method])
  }

  return form
}
