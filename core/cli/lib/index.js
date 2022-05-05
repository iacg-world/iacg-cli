"use strict"

module.exports = core

// require支持加载的资源 .js/.json/.node，其他文件会被当做js解析
const pkg = require("../package.json")
const log = require("@iacg-cli/log")
const semver = require("semver")
const colors = require("colors")

function core() {
  try {
    checkPkgVersion()
    checkUpdate()
    checkRoot()
  } catch (error) {
    log.error(error.message)
  }
}

function checkRoot() {
  require("root-check")()  // root账号启动检查和自动降级功能
}

async function checkUpdate() {
  const currentVersion = pkg.version
  const npmName = pkg.name
  const { getNpmSemverVersion } = require("@iacg-cli-dev/get-npm-info")
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      colors.yellow(`请手动更新 ${npmName}，当前版本：${currentVersion}，最新版本：${lastVersion}
                更新命令： npm install -g ${npmName}`),
    )
  }
}

function checkPkgVersion() {
  log.info("cli", pkg.version)
}
