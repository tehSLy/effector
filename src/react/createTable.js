//@flow
import type {Node} from 'react'
import {createStore, createEvent, type Event, type Store} from 'effector'
import {createComponent} from './createComponent'
import type {StoreView} from './index.h'
export type Coord = [number, number]

//ctor = ([x, y]) => ({fill: '#deca', selected: false})
export function createTable<Model, ModelView: Node>({
  init,
  view,
  cols,
  rows,
}: {
  init: (coord: Coord) => Model,
  view: (data: Model, coord: Coord) => ModelView,
  cols: number,
  rows: number,
}): {|
  +View: StoreView<{_: Array<Array<ModelView>>}, {}>,
  +modelView: Store<{_: Array<Array<ModelView>>}>,
  +setView: Event<(data: Model, coord: Coord) => ModelView>,
  +updateItems: Event<
    Array<{
      cell: Coord,
      +upd: Model | ((data: Model, coord: Coord) => Model),
    }>,
  >,
|} {
  function fill<T>(length, view: (n: number) => T): Array<T> {
    return Array.from({length}, (_, n) => view(n))
  }
  const model: Array<
    Array<{
      data: Model,
      coord: Coord,
    }>,
  > = fill(rows, y =>
    fill(cols, x => ({
      coord: [x, y],
      data: init([x, y]),
    })),
  )
  const setView: Event<(data: Model, coord: Coord) => ModelView> = createEvent()
  const updateItems: Event<
    Array<{
      cell: Coord,
      +upd: Model | ((data: Model, coord: Coord) => Model),
    }>,
  > = createEvent()

  const modelViewInitial: ModelView[][] = model.map(row =>
    row.map(({coord, data}) => view(data, coord)),
  )

  const modelView: Store<{_: ModelView[][]}> = createStore({
    _: modelViewInitial,
  })
  modelView.on(setView, ({_: modelView}, fn) => {
    view = fn
    for (let y = 0; y < modelView.length; y++) {
      const modelRow = model[y]
      const modelViewRow = modelView[y]
      for (let x = 0; x < modelViewRow.length; x++) {
        const {coord, data} = modelRow[x]
        modelViewRow[x] = view(data, coord)
      }
    }
    return {_: modelView}
  })
  modelView.on(updateItems, ({_: modelView}, updates) => {
    const updatedView = [...modelView]
    const updatedRows = new Set()
    for (const {cell, upd} of updates) {
      const [x, y] = cell
      const oldModel: {coord: Coord, data: Model} = model[y][x]
      let data
      if (typeof upd === 'function') {
        //$off
        data = upd(oldModel.data, cell)
      } else {
        data = upd
      }
      const newItem = {coord: cell, data}
      model[y][x] = newItem
      if (!updatedRows.has(y)) {
        updatedView[y] = [...updatedView[y]]
        updatedRows.add(y)
      }
      updatedView[y][x] = view(data, cell)
    }
    updatedRows.clear()
    return {_: updatedView}
  })

  const View: StoreView<{_: ModelView[][]}, {}> = createComponent(
    modelView,
    (props, {_}) => _,
  )

  return {
    View,
    updateItems,
    setView,
    modelView,
  }
}
