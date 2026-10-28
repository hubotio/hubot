'use strict'

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

// Puts a fake `npm` on the PATH that only records its arguments, so the
// generator can run without the network. On Windows it is an `npm.cmd` shim,
// like the real one.
const createFakeNpm = (binDir) => {
  fs.mkdirSync(binDir, { recursive: true })
  fs.writeFileSync(path.join(binDir, 'fake-npm.mjs'), `
import fs from 'node:fs'
const args = process.argv.slice(2)
fs.appendFileSync(process.env.FAKE_NPM_LOG, args.join(' ') + '\\n')
if (args[0] === 'init') fs.writeFileSync('package.json', '{}')
`)
  if (process.platform === 'win32') {
    fs.writeFileSync(path.join(binDir, 'npm.cmd'), `@"${process.execPath}" "%~dp0fake-npm.mjs" %*\r\n`)
  } else {
    const npm = path.join(binDir, 'npm')
    fs.writeFileSync(npm, `#!/bin/sh\nexec "${process.execPath}" "$(dirname "$0")/fake-npm.mjs" "$@"\n`)
    fs.chmodSync(npm, 0o755)
  }
}

describe('Running bin/Hubot.mjs --create', () => {
  it('should install the default scripts with npm', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hubot-create-'))
    try {
      const binDir = path.join(tmp, 'bin')
      const log = path.join(tmp, 'npm.log')
      createFakeNpm(binDir)
      const env = { ...process.env, FAKE_NPM_LOG: log }
      const pathKey = Object.keys(env).find(key => key.toUpperCase() === 'PATH') ?? 'PATH'
      env[pathKey] = `${binDir}${path.delimiter}${env[pathKey] ?? ''}`

      spawnSync(process.execPath, [path.join(root, 'bin', 'Hubot.mjs'), '--create', 'myhubot'], { cwd: tmp, env })

      const npmCalls = fs.readFileSync(log, 'utf8').trim().split('\n')
      assert.ok(npmCalls.includes('i hubot-help@latest hubot-rules@latest hubot-diagnostics@latest'), npmCalls.join('\n'))
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })
})
