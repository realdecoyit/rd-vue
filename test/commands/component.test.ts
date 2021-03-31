import {expect, test} from '@oclif/test'
import { CLI_COMMANDS } from '../../src/lib/constants'
// const rimraf = require('rimraf')

const testProjectName = 'rdv-component-test'
const testComponentName = 'hello-world'

describe(CLI_COMMANDS.AddComponent, () => {
  test
  .stdout()
  .command([CLI_COMMANDS.CreateProject, testProjectName])
  .do(() => process.chdir(testProjectName))
  .command([CLI_COMMANDS.AddComponent, testComponentName])
  .do(() => process.chdir('../'))
  // .do(() => {
  //   // cleanup generated files
  //   rimraf.sync(testProjectName)
  // })
  .it(`runs rdvue ${CLI_COMMANDS.AddComponent} ${testComponentName}`, ctx => {
    expect(ctx.stdout).to.contain(`[rdvue] new component module added: ${testComponentName}`)
  })
})
