import sinon from 'sinon'
import fs from 'fs'
import {injectLinesIntoMain} from '../../src/lib/plugins'
import {expect} from 'chai'

describe('lib/plugins.injectLinesIntoMain', () => {
  const line1 = `import '@/theme/_all.scss';`
  const line2 = `import Vue from 'vue';`
  const line3 = `new Vue({});`
  const dummyText = `${line1}\n${line2}\n${line3}`
  const targetPath = 'dummy'

  let readFileSyncStub: sinon.SinonStub
  let writeFileSyncStub: sinon.SinonStub

  beforeEach(() => {
    readFileSyncStub  = sinon.stub(fs, 'readFileSync').returns(dummyText)
    writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
  })

  it('default - injects string into main', () => {
    const content = `import myPlugin from 'myPlugin';\r\nVue.use(myPlugin);\r\n`
    const expectedOutput = `${line1}\n${line2}\n${content}\n${line3}`
    injectLinesIntoMain(targetPath, content)
    expect(writeFileSyncStub.getCall(0).args[1]).equals(expectedOutput)
  })

  it('default - injects array into main', () => {
    const content = [
      `import myPlugin from 'myPlugin';\r\n`,
      `Vue.use(myPlugin);\r\n`,
    ]
    const expectedOutput = `${line1}\n${line2}\n${content.join('')}\n${line3}`
    injectLinesIntoMain(targetPath, content)
    expect(writeFileSyncStub.getCall(0).args[1]).equals(expectedOutput)
  })

  it('auxiliary - main has no import statements', () => {
    const content = [
      `import myPlugin from 'myPlugin';\r\n`,
      `Vue.use(myPlugin);\r\n`,
    ]
    const line1 = '// a comment'
    const line2 = 'let a = 1;'
    const line3 = 'let b = a + 1;'

    readFileSyncStub.restore()
    readFileSyncStub  = sinon.stub(fs, 'readFileSync').returns(`${line1}\n${line2}\n${line3}`)
    const expectedOutput = `${content.join('')}\n${line1}\n${line2}\n${line3}`
    injectLinesIntoMain(targetPath, content)
    expect(writeFileSyncStub.getCall(0).args[1]).equals(expectedOutput)
  })

  afterEach(() => {
    readFileSyncStub.restore()
    writeFileSyncStub.restore()
  })
})
