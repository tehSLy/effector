// @flow

import {step} from '../stdlib'
import {startPhaseTimer, stopPhaseTimer} from './perf'

export function computeProfile({
  fn,
  fail = () => {},
}: {|
  fn: (data: any, scope: {[field: string]: any, ...}) => any,
  fail?: (error: mixed, scope: {[field: string]: any, ...}) => any,
|}) {
  return step.compute({
    fn(args, scope) {
      let stopPhaseTimerMessage = 'Got error'
      let result
      startPhaseTimer(scope.nodeInstance, scope.name)
      try {
        result = fn(args, scope)
        stopPhaseTimerMessage = null
      } catch (err) {
        console.error(err)
        fail(err, scope)
      }
      stopPhaseTimer(stopPhaseTimerMessage)
      return result
    },
  })
}

export function runProfile({
  fn,
  fail = () => {},
}: {|
  fn: (data: any, scope: {[field: string]: any, ...}) => any,
  fail?: (error: mixed, scope: {[field: string]: any, ...}) => any,
|}) {
  return step.run({
    fn(args, scope) {
      let stopPhaseTimerMessage = null
      startPhaseTimer(scope.nodeInstance, scope.name)
      if (args === scope.lastCall) {
        stopPhaseTimer(stopPhaseTimerMessage)
        return
      }
      scope.lastCall = args
      try {
        fn(args, scope)
      } catch (err) {
        console.error(err)
        fail(err, scope)
        stopPhaseTimerMessage = 'Got error'
      }
      stopPhaseTimer(stopPhaseTimerMessage)
    },
  })
}
