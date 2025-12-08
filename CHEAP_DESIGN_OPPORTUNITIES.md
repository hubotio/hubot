# Cheap Design Refactoring Opportunities

## Refactoring Complete ✅

This document originally captured Cheap Design refactoring opportunities in the Hubot codebase. All identified opportunities have been successfully implemented through 9 incremental refactors.

## Completed Refactors

1. ✅ **Script loaders** (Robot.mjs): 3 duplicate methods → unified `_loadScript`
2. ✅ **Adapter loading** (Robot.mjs): Nested if/else → resolver table strategy
3. ✅ **Catch-all fallback** (Robot.mjs): Recursive `receive()` → in-place message conversion
4. ✅ **Help parsing** (HelpParser.mjs): Isolated utility module
5. ✅ **Middleware consolidation** (Middleware.mjs): Added `executeAndAllow()` helper
6. ✅ **Response method consolidation** (Response.mjs): 6 duplicate methods → registry-driven generation
7. ✅ **Brain user lookup** (Brain.mjs): 3 similar search methods → unified `_findUsers()` helper with predicates
8. ✅ **Adapter method consolidation** (Adapter.mjs): Duplicate emote/reply → formatter-based delegation
9. ✅ **Listener registration** (Robot.mjs): Duplicate message-type listeners → `LISTENER_REGISTRY` and `_registerListener()` helper

---

## Key Principles Applied

All implementations follow Pfeifer's Cheap Design:
- **Move variation into data**: Method registries, predicate functions, transformer tables
- **Reduce control branching**: Replace if/else chains with table lookups and strategy patterns
- **Separate concerns**: Extract helpers, utilities, and formatters into focused modules
- **Leverage existing platform**: Use Object.entries(), Array.filter(), Map/Object lookups
- **Maintain backward compatibility**: All public APIs preserved; internal refactors only

## See README.md

For detailed information about each completed refactor, see the "Cheap Design Principle" section in README.md.


### 1. Response Method Consolidation ✅ (COMPLETED)
**Location:** `src/Response.mjs` (lines 23-75)

**Current Pattern:**
Six nearly-identical methods that differ only in method name and options:
- `send()` → calls `#runWithMiddleware('send', { plaintext: true }, ...strings)`
- `emote()` → calls `#runWithMiddleware('emote', { plaintext: true }, ...strings)`
- `reply()` → calls `#runWithMiddleware('reply', { plaintext: true }, ...strings)`
- `topic()` → calls `#runWithMiddleware('topic', { plaintext: true }, ...strings)`
- `play()` → calls `#runWithMiddleware('play', {}, ...strings)`
- `locked()` → calls `#runWithMiddleware('locked', { plaintext: true }, ...strings)`

**Cheap Design Solution:**
Create a response method registry/table mapping method names to options:
```javascript
const RESPONSE_METHODS = {
  send: { plaintext: true },
  emote: { plaintext: true },
  reply: { plaintext: true },
  topic: { plaintext: true },
  play: {},
  locked: { plaintext: true }
}

// Single factory that generates methods
Object.entries(RESPONSE_METHODS).forEach(([methodName, opts]) => {
  Response.prototype[methodName] = function (...strings) {
    return this.#runWithMiddleware(methodName, opts, ...strings)
  }
})
```

**Impact:** Removes ~60 lines of duplication; makes adding new response types trivial; clarifies what makes each method unique (just options).

**Feasibility:** HIGH - No external API changes, fully backward compatible.

---

### 2. **Adapter Method Consolidation** (MEDIUM IMPACT)
**Location:** `src/adapters/Shell.mjs` and `src/adapters/Campfire.mjs`

**Current Pattern:**
Adapters repeat similar logic across `send()`, `emote()`, `reply()`, etc. Each adapter reimplements the pattern:
- Shell: Maps emote to `* ${str}`, reply to `${name}: ${str}`
- Campfire: Same mapping pattern with different transport

**Cheap Design Solution:**
Create a base adapter method map that child adapters can override:
```javascript
class Adapter {
  // Method transformations (data)
  #methodTransforms = {
    emote: (str) => `*${str}*`,
    reply: (str, envelope) => `${envelope.user.name}: ${str}`
  }

  // Generic send implementation that child adapters extend
  async _sendWithTransform(methodName, envelope, ...strings) {
    const transform = this.#methodTransforms[methodName]
    const transformed = transform ? strings.map(s => transform(s, envelope)) : strings
    return await this.send(envelope, ...transformed)
  }
}
```

**Impact:** Reduces duplication across adapter implementations; standardizes method mapping.

**Feasibility:** MEDIUM - Requires careful inheritance design to avoid breaking adapters.

---

### 3. **Brain User Lookup Consolidation** (MEDIUM IMPACT)
**Location:** `src/Brain.mjs` (lines 160-200)

**Current Pattern:**
Multiple user lookup methods with similar filtering/search logic:
- `userForName(name)` - exact match on name
- `usersForRawFuzzyName(fuzzyName)` - prefix match
- `usersForFuzzyName(fuzzyName)` - exact fallback to prefix match
- Manual loops with similar predicates

**Cheap Design Solution:**
Create a unified user search function with pluggable predicates:
```javascript
_findUsers(predicate) {
  const users = this.data.users || {}
  return Object.values(users).filter(user => predicate(user))
}

userForName(name) {
  const lowerName = name.toLowerCase()
  const results = this._findUsers(u => u.name?.toLowerCase() === lowerName)
  return results[0] ?? null
}

usersForRawFuzzyName(fuzzyName) {
  const lowerName = fuzzyName.toLowerCase()
  return this._findUsers(u => 
    u.name?.toLowerCase().startsWith(lowerName)
  )
}

usersForFuzzyName(fuzzyName) {
  const exact = this._findUsers(u => 
    u.name?.toLowerCase() === fuzzyName.toLowerCase()
  )
  if (exact.length > 0) return exact
  return this.usersForRawFuzzyName(fuzzyName)
}
```

**Impact:** Removes loop duplication; clarifies search logic; makes predicates reusable.

**Feasibility:** HIGH - Internal refactor, no API changes.

---

### 4. **Router Method Registration** (LOW-MEDIUM IMPACT)
**Location:** `src/Robot.mjs` - HTTP router methods

**Current Pattern:**
Public API methods like `hear()`, `respond()`, `enter()`, `leave()`, `topic()` all:
1. Accept similar parameter patterns (regex/matcher, options, callback)
2. Normalize optional parameters
3. Create appropriate listener type
4. Push to `this.listeners`

**Cheap Design Solution:**
Create a listener registration registry:
```javascript
const LISTENER_TYPES = {
  hear: TextListener,
  respond: (regex, options, callback) => {
    const pattern = this.respondPattern(regex)
    return new TextListener(this, pattern, options, callback)
  },
  enter: { matcher: msg => msg instanceof Message.EnterMessage },
  leave: { matcher: msg => msg instanceof Message.LeaveMessage },
  topic: { matcher: msg => msg instanceof Message.TopicMessage }
}

#registerListener(type, arg1, arg2, arg3) {
  // Normalize args
  const [matcher, options, callback] = this._normalizeListenerArgs(arg1, arg2, arg3)
  const config = LISTENER_TYPES[type]
  const listener = new (config.listenerClass || Listener)(this, matcher, options, callback)
  this.listeners.push(listener)
}
```

**Impact:** Reduces method duplication; makes pattern clearer; easier to add new listener types.

**Feasibility:** MEDIUM - Requires refactoring multiple public API methods.

---

## Recommended Next Steps

1. **Start with Response Method Consolidation** (HIGH priority, quickest win)
   - Highest impact-to-complexity ratio
   - Fully isolated in Response.mjs
   - 60 lines of clear duplication
   - Fully backward compatible

2. **Then Brain User Lookup** (HIGH priority, good impact)
   - Clean internal refactor
   - Clarifies search predicates
   - No API changes needed

3. **Optional: Adapter Method Consolidation** (if time permits)
   - Requires coordination across adapter files
   - More complex inheritance changes
   - Good long-term architectural improvement

---

## Refactoring Principles Applied

All opportunities follow Pfeifer's Cheap Design:
- **Move variation into data** (method name maps, predicate functions, type registries)
- **Reduce control branching** (if/else → table lookup)
- **Separate concerns** (each method does one thing, not n similar things)
- **Leverage existing platform** (Object.entries, Array.filter, Map/Object lookups)
