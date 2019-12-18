#!/usr/bin/env node

'use strict'

const prog = require('caporal')
const acorn = require('acorn')
const glob = require('glob')
const fs = require('fs')
const path = require('path')

const pkg = require('./package.json')
const argsArray = process.argv

/**
 * es-check 🏆
 * ----
 * - define the EcmaScript version to check for against a glob of JavaScript files
 * - match the EcmaScript version option against a glob of files
 *   to to test the EcmaScript version of each file
 * - error failures
*/
prog
  .version(pkg.version)
  .argument(
    '[ecmaVersion]',
    'ecmaVersion to check files against. Can be: es3, es4, es5, es6/es2015, es7/es2016, es8/es2017, es9/es2018, es10/es2019'
  ).argument(
    '[files...]',
    'a glob of files to to test the EcmaScript version against'
  )
  .option('--module', 'use ES modules')
  .option('--allow-hash-bang', 'if the code starts with #! treat it as a comment')
  .action((args, options, logger) => {

    const configFilePath = path.resolve(process.cwd(), '.escheckrc')

    let v, files, e, esmodule, allowHashBang
    let config = {}

    /**
     * Check for a configuration file. If one exists, default to those options
     * if no command line arguments are passed in
     */
    if (fs.existsSync(configFilePath)) {
      config = JSON.parse(fs.readFileSync(configFilePath))
    }

    v = args.ecmaVersion
      ? args.ecmaVersion
      : config.ecmaVersion

    files = args.files.length
      ? args.files
      : [].concat(config.files)

    esmodule = options.module
      ? options.module
      : config.module

    allowHashBang = options.allowHashBang
      ? options.allowHashBang
      : config.allowHashBang

    if (!v) {
      logger.error(
        'No ecmaScript version passed in or found in .escheckrc. Please set your ecmaScript version in the CLI or in .escheckrc'
      )
      process.exit(1)
    }

    if (!files || !files.length) {
      logger.error(
        'No files were passed in please pass in a list of files to es-check!'
      )
      process.exit(1)

    }

    /**
     * define ecmaScript version
     * - Default ecmaScript version is '5'
     */
    switch (v) {
      case 'es3':
        e = '3'
        break
      case 'es4':
        e = '4'
        break
      case 'es5':
        e = '5'
        break
      case 'es6':
        e = '6'
        break
      case 'es7':
        e = '7'
        break
      case 'es8':
        e = '8'
        break
      case 'es9':
        e = '9'
        break
      case 'es10':
        e = '10'
        break
      case 'es2015':
        e = '6'
        break
      case 'es2016':
        e = '7'
        break
      case 'es2017':
        e = '8'
        break
      case 'es2018':
        e = '9'
        break
      case 'es2019':
        e = '10'
        break
      default:
        logger.error('Invalid ecmaScript version, please pass a valid version, use --help for help');
        process.exit(1);
    }

    const errArray = []
    const globOpts = { nodir: true }
    const acornOpts = { ecmaVersion: e, silent: true }

    logger.debug(`ES-Check: Going to check files using version ${e}`)

    if (esmodule) {
      acornOpts.sourceType = 'module'
      logger.debug('ES-Check: esmodule is set')
    }

    if (allowHashBang) {
      acornOpts.allowHashBang = true
      logger.debug('ES-Check: allowHashBang is set')
    }

    files.forEach((pattern) => {
      /**
       * pattern => glob or array
       */
      const globbedFiles = glob.sync(pattern, globOpts)

      if (globbedFiles.length === 0) {
        logger.error(`ES-Check: Did not find any files to check for ${pattern}.`)
        process.exit(1);
      }

      globbedFiles.forEach((file) => {
        const code = fs.readFileSync(file, 'utf8')

        logger.debug(`ES-Check: checking ${file}`)
        try {
          acorn.parse(code, acornOpts)
        } catch (err) {
          logger.debug(`ES-Check: failed to parse file: ${file} \n - error: ${err}`)
          const errorObj = {
            err,
            stack: err.stack,
            file,
          }
          errArray.push(errorObj)
        }
      })
    })

    if (errArray.length > 0) {
      logger.error(`ES-Check: there were ${errArray.length} ES version matching errors.`)
      errArray.forEach((o) => {
        logger.info(`
          ES-Check Error:
          ----
          · erroring file: ${o.file}
          · error: ${o.err}
          · see the printed err.stack below for context
          ----\n
          ${o.stack}
        `)
      })
      process.exit(1)
    }
    logger.error(`ES-Check: there were no ES version matching errors!  🎉`)
  })

prog.parse(argsArray)
