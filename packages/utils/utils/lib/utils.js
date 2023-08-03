'use strict'

function isWin32 () {
  return process.platform === 'win32'
}

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}

function spinnerStart(msg, spinnerString = '|/-\\') {
  const Spinner = require('cli-spinner').Spinner
  const spinner = new Spinner(msg + ' %s')
  spinner.setSpinnerString(spinnerString)
  spinner.start()
  return spinner
}

function sleep(timeout = 1000) {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

function exec(command, args, options) {
  if (isWin32() && command !== 'node') {
    command += '.cmd'
  }
  return require('child_process').spawn(command, args, options || {})
}

function execAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = exec(command, args, options)
    p.on('error', (e) => {
      reject(e)
    })
    p.on('exit', (c) => {
      resolve(c)
    })
  })
}

module.exports = {
  isObject,
  spinnerStart,
  sleep,
  exec,
  execAsync,
}
