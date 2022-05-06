"use strict"

module.exports = core

// require支持加载的资源 .js/.json/.node，其他文件会被当做js解析
const pkg = require("../package.json")
const log = require("@iacg-cli/log")
const semver = require("semver")
const colors = require("colors")
const userHome = require("user-home")
const pathExists = require("path-exists")
const path = require("path")

const constant = require("./const")

function core() {
  try {
    checkPkgVersion()
    checkUpdate()
    checkRoot()
    checkUserHome()
    checkEnv()
  } catch (error) {
    log.error(error.message)
  }
}

function checkRoot() {
  require("root-check")() // root账号启动检查和自动降级功能
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red("当前登录用户主目录不存在！"))
  }
}

// 检查环境变量
function checkEnv() {
  const dotenv = require("dotenv")
  const dotenvPath = path.resolve(userHome, ".env")
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    })
  }
  createDefaultConfig()
  log.info("环境变量", process.env.CLI_HOME_PATH)
}

// 创建默认cli配置
function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  }
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig["cliHome"] = path.join(userHome, constant.DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome
}

async function checkUpdate() {
  // 1. 获取当前版本号和模块名与npm线上作对比
  const currentVersion = pkg.version
  const npmName = pkg.name
  // 2. 调用npm API 获取所有package版本号
  // 3. 提取所有版本号，比对哪些版本号是大于当前版本号，并提示用户更新
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
