import shell from 'shelljs'
import cli from 'cli-ux'
const util = require('util');
const exec = util.promisify(shell.exec);
import { Command, flags } from '@oclif/command'
import path from 'path'
import chalk from 'chalk'
import { Files } from '../../modules'
import { copyFiles, parseDynamicObjects, parseModuleConfig, updateDynamicImportsAndExports } from '../../lib/files'
import { checkProjectValidity, isJsonString } from '../../lib/utilities'
import { CLI_COMMANDS, CLI_STATE, DYNAMIC_OBJECTS } from '../../lib/constants'

const TEMPLATE_FOLDERS = ['buefy']
export default class Buefy extends Command {
  static description = 'lightweigth UI components for Vuejs'

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  static args = []

  // override Command class error handler
  async catch(error: Error) {
    const errorMessage = error.message
    const isValidJSON = isJsonString(errorMessage)
    const parsedError = isValidJSON ? JSON.parse(errorMessage) : {}
    const customErrorCode = parsedError.code
    const customErrorMessage = parsedError.message
    const hasCustomErrorCode = customErrorCode !== undefined

    if (hasCustomErrorCode === false) {
      // throw cli errors to be handled globally
      throw errorMessage
    }

    // handle errors thrown with known error codes
    switch (customErrorCode) {
      case 'project-invalid': this.log(`${CLI_STATE.Error} ${customErrorMessage}`)
        break
      case 'missing-template-file': this.log(`${CLI_STATE.Error} ${customErrorMessage}`)
        break
      case 'missing-template-folder': this.log(`${CLI_STATE.Error} ${customErrorMessage}`)
        break
      case 'dependency-install-error': this.log(`${CLI_STATE.Error} ${customErrorMessage}`)
        break
      default: throw new Error(customErrorMessage)
    }

    // exit with status code
    // this.exit(1)
  }

  async run() {
    const { isValid: isValidProject, projectRoot } = checkProjectValidity()
    // block command unless being run within an rdvue project
    if (isValidProject === false) {
      throw new Error(
        JSON.stringify({
          code: 'project-invalid',
          message: `${CLI_COMMANDS.PluginBuefy} command must be run in an existing ${chalk.yellow('rdvue')} project`,
        })
      )
    }

    const folderList = TEMPLATE_FOLDERS
    let sourceDirectory: string
    let installDirectory: string

    // parse config files required for scaffolding this module
    const configs = parseModuleConfig(folderList, projectRoot)
    const config = configs[0]
    const files: Array<string | Files> = config.manifest.files
    const dependencies = config.manifest.packages.dependencies.toString().split(',').join(' ')

    try {
      // install dependencies
      cli.action.start(`${CLI_STATE.Info} installing dependencies`)
      const { stdout: depStdout, stderr: depStderr, code: depCode } = await exec(`npm install --save ${dependencies}`, { silent: true })
      cli.action.stop()

    } catch (error) {
      throw new Error(
        JSON.stringify({
          code: 'dependency-install-error',
          message: `${this.id?.split(':')[1]} dependencies failed to install`,
        })
      )
    }

    sourceDirectory = path.join(config.moduleTemplatePath, config.manifest.sourceDirectory)
    installDirectory = path.join(projectRoot, 'src', config.manifest.installDirectory)

    // copy and update files for plugin being added
    await copyFiles(sourceDirectory, installDirectory, files)
    await parseDynamicObjects(JSON.stringify(config.manifest.routes, null, 1), DYNAMIC_OBJECTS.Routes);
    updateDynamicImportsAndExports('theme', config.manifest.projectTheme, '_all.scss');
    updateDynamicImportsAndExports('modules/core', config.manifest.moduleImports, 'index.ts');

    this.log(`${CLI_STATE.Success} plugin added: ${this.id?.split(':')[1]}`)
  }
}