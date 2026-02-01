import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const targets = [
  'src',
  'test',
  'bin',
  'configuration',
  'sfab-hooks',
  'script'
]

const ignoreDirs = new Set([
  'node_modules',
  '.git',
  '_site',
  'docs'
])

const extensions = new Set(['.mjs', '.js'])

const issues = []

const isIgnoredDir = (dirName) => ignoreDirs.has(dirName)

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!isIgnoredDir(entry.name)) {
        await walk(fullPath)
      }
      continue
    }
    if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (extensions.has(ext)) {
        await lintFile(fullPath)
      }
    }
  }
}

const lintFile = async (filePath) => {
  const content = await fs.readFile(filePath, 'utf8')
  const normalizedContent = content.replace(/\r\n/g, '\n')
  const lines = normalizedContent.split('\n')
  const hasFinalNewline = normalizedContent.endsWith('\n')

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    if (line.includes('\t')) {
      issues.push({ filePath, lineNumber, message: 'tab character found' })
    }
    if (/[ \t]+$/.test(line)) {
      issues.push({ filePath, lineNumber, message: 'trailing whitespace' })
    }
  })

  if (!hasFinalNewline) {
    issues.push({ filePath, lineNumber: lines.length, message: 'missing final newline' })
  }
}

const run = async () => {
  for (const target of targets) {
    const dir = path.join(projectRoot, target)
    try {
      const stat = await fs.stat(dir)
      if (stat.isDirectory()) {
        await walk(dir)
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error
      }
    }
  }

  if (issues.length > 0) {
    for (const issue of issues) {
      const relPath = path.relative(projectRoot, issue.filePath)
      console.error(`${relPath}:${issue.lineNumber} ${issue.message}`)
    }
    console.error(`\nFound ${issues.length} lint issue(s)`)
    process.exitCode = 1
    return
  }

  console.log('Lint OK')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
