'use strict'

const inquirer = require('inquirer')
const fse = require('fs-extra')
const semver = require('semver')
const userHome = require('user-home')
const fs = require('fs')
const path = require('path')

const Command = require('@iacg-cli/command')
const log = require('@iacg-cli/log')
const Package = require('@iacg-cli/package')
const { spinnerStart, sleep } = require('@iacg-cli/utils')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
const PREFIX_UNICODE = {
  INIT: '\ud83d\udccc',
  INPUT: '✍️ ',
}

const getProjectTemplate = require('./getProjectTemplate')

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
      this.downloadTemplate()
      // 3. 安装模板ll
    } catch (error) {
      log.error(error)
    }
  }

  async prepare() {
    // throw new Error("出错了")
    const template = await getProjectTemplate()

    if (!this.checkTemplate(template)) {
      throw new Error('项目模板不存在')
    }
    this.template = template
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
          message: `${
            this.force ? '当前目录不为空，' : ''
          }是否确认清空当前目录下的文件？`,
        })
        if (confirmDelete) {
          // 清空当前目录
          fse.emptyDirSync(localPath)
        }
      }
    }

    const projectInfo = await this.getProjectInfo()
    this.projectInfo = projectInfo
    return projectInfo
  }

  checkTemplate(template) {
    // 0. 判断项目模板是否存在
    return template && template.length !== 0
  }

  async getProjectInfo() {
    // 1. 选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: TYPE_PROJECT,
      prefix: PREFIX_UNICODE.INIT,
      choices: [
        {
          name: '项目',
          value: TYPE_PROJECT,
        },
        {
          name: '组件',
          value: TYPE_COMPONENT,
        },
      ],
    })
    log.verbose('type', type)

    const createProjectTemplate = async () => {
      // 2. 获取项目的基本信息
      const project = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: '请输入项目名称',
          prefix: PREFIX_UNICODE.INPUT,
          default: '',
          validate: function (v) {
            const done = this.async()
            setTimeout(function () {
              // 1.首字符必须为英文字符
              // 2.尾字符必须为英文或数字，不能为字符
              // 3.字符仅允许"-和_"
              if (
                !/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
                  v
                )
              ) {
                done('请输入合法的项目名称')
                return
              }
              done(null, true)
            }, 0)
          },
          filter: function (v) {
            return v
          },
        },
        {
          type: 'input',
          name: 'projectVersion',
          message: '请输入项目版本号',
          default: '1.0.0',
          prefix: PREFIX_UNICODE.INPUT,
          validate: function (v) {
            const done = this.async()
            setTimeout(function () {
              if (!!!semver.valid(v)) {
                done('请输入合法的版本号')
                return
              }
              done(null, true)
            }, 0)
          },
          filter: function (v) {
            if (!!semver.valid(v)) {
              return semver.valid(v)
            } else {
              return v
            }
          },
        },
        {
          type: 'list',
          name: 'projectTemplate',
          prefix: PREFIX_UNICODE.INPUT,
          message: '请选择项目模板',
          choices: this.createTemplateChoice(),
        },
      ])

      return {
        type,
        ...project,
      }
    }

    const projectMap = {
      [TYPE_PROJECT]: createProjectTemplate,
    }
    return projectMap[type]()
  }

  async downloadTemplate() {
    const { projectTemplate } = this.projectInfo
    const templateInfo = this.template.find(
      (item) => item.npmName === projectTemplate
    )

    const targetPath = path.resolve(userHome, '.iacg-cli', 'template')
    const storeDir = path.resolve(
      userHome,
      '.iacg-cli',
      'template',
      'node_modules'
    )

    const { npmName, version } = templateInfo
    const templateNpm = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version,
    })
    if (!(await templateNpm.exists())) {
      const spinner = spinnerStart('正在下载模板...')
      // await sleep()
      try {
        await templateNpm.install()
        log.success('下载模板成功')
      } catch (e) {
        throw e
      } finally {
        spinner.stop(true)
      }
    } else {
      const spinner = spinnerStart('正在更新模板...')
      await sleep()
      try {
        await templateNpm.update()
        log.success('更新模板成功')
      } catch (e) {
        throw e
      } finally {
        spinner.stop(true)
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
