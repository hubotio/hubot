---
title: TypeScript Support
layout: layouts/docs.html
permalink: /typescript.html
---

# TypeScript Support

Hubot now supports TypeScript scripts alongside JavaScript. This allows you to write your Hubot scripts with full type safety and modern JavaScript features.

## Getting Started

To use TypeScript with Hubot:

1. Create `.ts` files in your scripts directory
2. Use proper type annotations from the hubot module
3. Run `npm run build` to compile TypeScript files
4. Start hubot as normal with `npm start`

## Example Script

Here's an example TypeScript script that implements a welcome message:

```typescript
import type { Robot } from 'hubot'

export default async (robot: Robot) => {
  const welcomeMessages = [
    'Welcome to the team! 👋',
    'Hello there! Great to have you here!',
    'Welcome aboard! 🚀'
  ]
  
  robot.enter(async (res) => {
    const username = res.message.user.name
    await res.send(res.random(welcomeMessages))
  })
}
```

## Type Definitions

Hubot provides TypeScript definitions for all core classes and interfaces:

- `Robot` - The main Hubot instance
- `Response` - Wrapper for handling message responses
- `Message` - Base message class and its variants (EnterMessage, LeaveMessage, etc.)
- `Brain` - Hubot's storage system
- `Adapter` - Base class for chat service adapters

## Development Workflow

1. Install dependencies:
```bash
npm install
```

2. Create your TypeScript script in the scripts directory:
```bash
touch scripts/your-script.ts
```

3. Use the watch mode during development:
```bash
npm run watch
```

4. Build for production:
```bash
npm run build
```

## Notes

- TypeScript files are automatically compiled to JavaScript before being loaded
- Source maps are generated for better debugging
- Existing JavaScript (.js and .mjs) scripts continue to work normally
- The `dist` directory contains compiled JavaScript files and should be in your .gitignore
