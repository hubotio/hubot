const { spawn, spawnSync } = require('child_process')
const File = require('fs')
const path = require('path')

function runCommands(hubotDirectory, options) {
  try {
    spawnSync('mkdir', [hubotDirectory])
    console.log(`${hubotDirectory} created successfully.`)
  } catch (error) {
    console.log(`${hubotDirectory} exists, continuing to the next operation.`)
  }
  
  const envFilePath = path.resolve(process.cwd(), '.env')
  process.chdir(hubotDirectory)

  spawnSync('npm', ['init', '-y'])
  spawnSync('npm', ['i', 'hubot'].concat(options.adapter))
  const packageJsonPath = path.resolve('./', 'package.json')
  const packageJson = JSON.parse(File.readFileSync(packageJsonPath, 'utf8'))

  packageJson.scripts = {
    start: 'hubot',
  }
  if(options.adapter) {
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
  

//   const hubotProcess = spawn('npx', ['hubot'], { stdio: 'inherit', env: process.env })
//   hubotProcess.on('exit', (code) => {
//     console.log(`Hubot process exited with code ${code}`)
//     process.exit(code)
//   })
}

async function spawnAsync(command, args) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, { stdio: 'inherit', env: process.env })

    childProcess.on('error', (error) => {
      reject(error)
    })

    childProcess.on('exit', (code) => {
      if (code === 0) {
        resolve(childProcess)
      } else {
        reject(new Error(`Command '${command} ${args.join(' ')}' exited with code ${code}`))
      }
    })
  })
}

module.exports = (hubotDirectory, options) => {
  try {
    runCommands(hubotDirectory, options)
  } catch (error) {
    console.error('An error occurred:', error)
  }  
}