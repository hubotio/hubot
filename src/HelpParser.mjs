'use strict'

import fs from 'node:fs'
import path from 'node:path'

const DOCUMENTATION_SECTIONS = ['description', 'dependencies', 'configuration', 'commands', 'notes', 'author', 'authors', 'examples', 'tags', 'urls']

// Private: Check if a line is a comment
function isCommentLine (line) {
  return /^(#|\/\/)/.test(line)
}

// Private: Remove leading comment markers from a line
function removeCommentPrefix (line) {
  return line.replace(/^[#/]+\s*/, '')
}

// Private: Extract header comment block from file content
// Returns an object with { lines: [...], isHeader: false } when header ends
function extractHeaderCommentBlock (block, currentLine) {
  if (!block.isHeader) {
    return block
  }

  if (isCommentLine(currentLine)) {
    block.lines.push(removeCommentPrefix(currentLine))
  } else {
    block.isHeader = false
  }

  return block
}

// Private: Parse comment lines into documentation sections
// Returns { description, commands, ..., legacyMode }
function parseDocumentationSections (lines, robotName) {
  const scriptDocumentation = {}
  let currentSection = null
  let legacyMode = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.toLowerCase() === 'none') {
      continue
    }

    const nextSection = line.toLowerCase().replace(':', '')
    if (DOCUMENTATION_SECTIONS.indexOf(nextSection) !== -1) {
      currentSection = nextSection
      scriptDocumentation[currentSection] = []
    } else {
      if (currentSection) {
        scriptDocumentation[currentSection].push(line)
      }
    }
  }

  if (currentSection === null) {
    legacyMode = true
    scriptDocumentation.commands = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.match('-')) {
        continue
      }

      const cleanedLine = line.slice(2, +line.length + 1 || 9e9).replace(/^hubot/i, robotName).trim()
      scriptDocumentation.commands.push(cleanedLine)
    }
  }

  return { scriptDocumentation, legacyMode }
}

// Public: Parse help documentation from a script file
// filePath - A String path to the file on disk
// robotName - A String name of the robot (used to replace 'hubot' in legacy mode)
// Returns { scriptDocumentation, commands, legacyMode }
export function parseHelp (filePath, robotName) {
  const body = fs.readFileSync(path.resolve(filePath), 'utf-8')

  // Extract header comment block
  const useStrictHeaderRegex = /^["']use strict['"];?\s+/
  const lines = body.replace(useStrictHeaderRegex, '').split(/(?:\n|\r\n|\r)/)
    .reduce(extractHeaderCommentBlock, { lines: [], isHeader: true }).lines
    .filter(Boolean) // remove empty lines

  // Parse sections from header comments
  const { scriptDocumentation, legacyMode } = parseDocumentationSections(lines, robotName)

  // Extract commands list
  const commands = scriptDocumentation.commands || []

  return { scriptDocumentation, commands, legacyMode }
}

export default {
  parseHelp
}
