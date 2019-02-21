#!/usr/bin/env bash
$(yarn bin)/tsc -p .
$(yarn bin)/flow focus-check ./types.test.js