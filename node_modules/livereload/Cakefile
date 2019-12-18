{spawn} = require 'child_process'
task 'build', "Build CoffeeScript source file", ->
  coffee = spawn 'coffee', ['-c', 'lib']
  coffee.stdout.on 'data', (data) -> console.log data.toString().trim()

task 'watch', 'Build CoffeeScript source files continously', ->
  coffee = spawn 'coffee', ['-cw', 'lib']
  coffee.stdout.on 'data', (data) -> console.log data.toString().trim()
