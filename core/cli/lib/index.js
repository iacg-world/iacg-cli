"use strict"


// require支持加载的资源 .js/.json/.node，其他文件会被当做js解析
const pkg = require("../package.json")
const log = require("@iacg-cli/log")
const semver = require("semver")
const colors = require("colors")
const userHome = require("user-home")
const pathExists = require("path-exists")
const path = require("path")
const program = require("commander")

const constant = require("./const")
const exec = require('@iacg-cli/exec')
const formatPath= require("@iacg-cli/format-path")

async function core() {
  try {
    await prepare()
    registerCommand()
  } catch (error) {
    log.error(error.message)
  }
}

async function prepare() {
  checkPkgVersion();
  checkRoot();
  checkUserHome();
  checkEnv();
  await checkUpdate();
}

// 注册命令
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0]) // 从bin 获取属性名称
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d, --debug", "是否开启调试模式", false)
    .option("-tp, --targetPath <targetPath>", "是否指定本地调试文件路径", "")

  program
    .command("init [projectName]")
    .option("-f, --force", "是否强制初始化项目")
    .action(exec)


  // 开启debug模式
  program.on("option:debug", function () {
    if (program.debug) {
      process.env.LOG_LEVEL = "verbose"
    } else {
      process.env.LOG_LEVEL = "info"
    }
    log.level = process.env.LOG_LEVEL
  })

  // 指定targetPath
  program.on("option:targetPath", function () {
    const targetPath = formatPath(program.targetPath)
    process.env.CLI_TARGET_PATH = targetPath
  })

  // 对未知命令监听
  program.on("command:*", function (obj) {
    const availableCommands = program.commands.map(cmd => cmd.name())
    log.warn(colors.red("未知的命令：" + obj[0]))
    if (availableCommands.length > 0) {
      log.notice(colors.red("可用命令：" + availableCommands.join(",")))
    }
  })

  program.parse(process.argv)

  if (program.args && program.args.length < 1) {
    // args是一个传入参数的数组
    program.outputHelp()
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
  const { getNpmSemverVersion } = require("@iacg-cli/get-npm-info")
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

module.exports = core
