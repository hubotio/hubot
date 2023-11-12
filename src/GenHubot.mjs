import { spawnSync } from 'node:child_process'
import File from 'node:fs'
import path from 'node:path'

function runCommands (hubotDirectory, options) {
  options.hubotInstallationPath = options?.hubotInstallationPath ?? 'hubot'
  console.log('creating hubot directory', hubotDirectory)
  try {
    spawnSync('mkdir', [hubotDirectory])
  } catch (error) {
    console.log(`${hubotDirectory} exists, continuing to the next operation.`)
  }
  const envFilePath = path.resolve(process.cwd(), '.env')
  process.chdir(hubotDirectory)

  let output = spawnSync('npm', ['init', '-y'])
  console.log('npm init', output.stderr.toString(), output.stdout.toString())
  output = spawnSync('npm', ['i', 'hubot-help@latest', 'hubot-rules@latest', 'hubot-diagnostics@latest'].concat([options.hubotInstallationPath, options.adapter]).filter(Boolean))
  console.log('npm i', output.stderr.toString(), output.stdout.toString())
  spawnSync('mkdir', ['scripts'])
  spawnSync('touch', ['external-scripts.json'])

  const externalScriptsPath = path.resolve('./', 'external-scripts.json')
  let escripts = File.readFileSync(externalScriptsPath, 'utf8')
  if (escripts.length === 0) escripts = '[]'
  const externalScripts = JSON.parse(escripts)
  externalScripts.push('hubot-help')
  externalScripts.push('hubot-rules')
  externalScripts.push('hubot-diagnostics')

  File.writeFileSync(externalScriptsPath, JSON.stringify(externalScripts, null, 2))

  File.writeFileSync('./scripts/example.mjs', `// Description:
//   Test script
//
// Commands:
//   hubot helo - Responds with Hello World!.
//
// Notes:
//   This is a test script.
//

export default (robot) => {
  robot.respond(/helo/, async res => {
    await res.send('Hello World!')
  })
}`)

  const packageJsonPath = path.resolve(process.cwd(), 'package.json')
  const packageJson = JSON.parse(File.readFileSync(packageJsonPath, 'utf8'))

  packageJson.scripts = {
    start: 'hubot'
  }
  packageJson.description = 'A simple helpful robot for your Company'
  if (options.adapter) {
    packageJson.scripts.start += ` --adapter ${options.adapter}`
  }

  File.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  console.log('package.json updated successfully.')
  const hubotEnvFilePath = path.resolve('.env')

  try {
    File.accessSync(envFilePath)
    File.copyFileSync(envFilePath, hubotEnvFilePath)
    console.log('.env file copied successfully.')

    const envContent = File.readFileSync(hubotEnvFilePath, 'utf8')
    const envLines = envContent.split('\n')

    for (const line of envLines) {
      const trimmedLine = line.trim()

      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...values] = trimmedLine.split('=')
        const value = values.join('=')
        process.env[key] = value
      }
    }
  } catch (error) {
    console.log('.env file not found, continuing to the next operation.')
  }
}
export default (hubotDirectory, options) => {
  try {
    runCommands(hubotDirectory, options)
  } catch (error) {
    console.error('An error occurred:', error)
  }
}
