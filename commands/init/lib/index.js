'use strict'

const inquirer = require('inquirer')
const fse = require('fs-extra')

const Command = require('@iacg-cli/command')
const log = require('@iacg-cli/log')

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._cmd.force
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }

  async exec() {
    try {
      // 1. 准备阶段
      await this.prepare()
      // 2. 下载模板
      // 3. 安装模板ll
    } catch (error) {
      log.error(error)
    }
  }
  async prepare() {
    // throw new Error("出错了")
    // 0. 判断项目模板是否存在
    // const template = await getProjectTemplate()
    // if (!template || template.length === 0) {
    //   throw new Error('项目模板不存在')
    // }
    // this.template = template
    // 1. 判断当前目录是否为空
    const localPath = process.cwd()
    log.verbose('localPath', localPath)
    if (!this.isDirEmpty(localPath)) {
      let ifContinue = false
      if (!this.force) {
        // 询问是否继续创建
        ifContinue = (
          await inquirer.prompt({
            type: 'confirm',
            name: 'ifContinue',
            default: false,
            message: '当前文件夹不为空，是否继续创建项目？',
          })
        ).ifContinue
        if (!ifContinue) {
          return
        }
      }
      // 2. 是否启动强制更新
      if (ifContinue || this.force) {
        // 给用户做二次确认
        const { confirmDelete } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          default: false,
          message: `${this.force ? '当前目录不为空，': ''}是否确认清空当前目录下的文件？`,
        })
        if (confirmDelete) {
          // 清空当前目录
          fse.emptyDirSync(localPath)
        }
      }
    }
  }



  isDirEmpty(localPath) {
    let fileList = fs.readdirSync(localPath)
    // 文件过滤的逻辑
    fileList = fileList.filter(
      (file) => !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
    )
    return !fileList || fileList.length <= 0
  }

  createTemplateChoice() {
    return this.template.map((item) => ({
      value: item.npmName,
      name: item.name,
    }))
  }
}

function init(argv) {
  // console.log('init', projectName, cmdObj.force, process.env.CLI_TARGET_PATH);
  return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
