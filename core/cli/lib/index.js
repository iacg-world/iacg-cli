"use strict"

module.exports = core

// require支持加载的资源 .js/.json/.node，其他文件会被当做js解析
const pgk = require("../package.json")
const log = require("@iacg-cli/log")

function core() {
  console.log("exec core")
  checkPkgVersion()
}

function checkPkgVersion() {
  console.log(pgk.version)
  log()
}
