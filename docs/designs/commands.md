You are an expert javascript and Node.js engineer implementing a backwards-compatible command subsystem for Hubot.

IMPORTANT: Use TDD. Start by writing tests that describe the behavior, then implement the code to make the tests pass. Do not begin implementation until you have written the tests. Keep changes small and incremental.

High-level goal:
Add a new deterministic command bus to Hubot via robot.commands while preserving full backwards compatibility with existing robot.respond() and robot.hear() scripts. This must be safe-by-default and must not introduce broad “catch-all” behavior.

Constraints:
- Minimal dependencies (prefer none).
- Defensive coding: invalid input must not crash the bot.
- Design for adapter variability (Slack/Discord/etc), but implement renderer as simple text initially.
- Existing scripts must run unchanged.

Behavioral requirements (what must be true):
1.	Backwards compatibility

- A bot with legacy listeners (respond/hear) behaves the same after adding robot.commands.
- The new subsystem must not consume arbitrary messages. It only intercepts:
a) confirmation replies (yes/no/cancel) when a pending confirmation exists for that user+room

2. New API surface
implement robot.commands with these capabilities.
- Registration with spec and optional opts - handle unregister and update
- get command by id, list commands with a filter, get help for a command by id
- parse the text into a ParsedInvocation that is nullable
- validate with command id, rawArgs and context meta
- execute the command by command id, raw args and execution context asynchronously
- invoke the invocation text with execution context asynchronously that will parse -> validate -> execute pipeline
- propse a given propsal with execution context asynchronously
- confirm the users reply text with the execution context asynchronously
- prending proposal store keyed by userid + roomid with a TTL

# 3. Command Shape
A command is registered as:
- id - string, uniqueue, required)
- description - string
- aliases - string[], optional (alternate names that resolve to this command id)
- examples - string[], optional
- args schema (optional):
    - arg name: {type, required?, default?, values?}
- side effects - string[], optional
- confirm policy - "never" | "if_ambiguous" | "always" (optional)
- permissions - { rooms?: string[], roles?: string[]} (optional)
- handler async function with `{ args, context }` (required)

# 4. Canonical invocation parsing
Parse messages like:
- tickets.create -- title "VPN down" --priority high --assignee matt --room #ops
    - also support key:value tokens
        - tickets.create title:"VPN down" prioriy:high
    - also support command aliases (resolved by parse() to their canonical id)
        - if tickets.create has alias 'ticket.new', then ticket.new also works
- Must support quoted strings, bare words, boolean flags

# 5. Validation and normalization

- Apply defaults from schema
- Enforce required args
- Validate enums
- Support types: string, number, boolean, enum, user, room, date
- Built-in resolvers:
    - user: attempt to map a string to a Hubot user from robot.brain.users()
    - room: validate #room format
    - date: support today, tomorrow, ISO, and “YYYY-MM-DD HH:mm” (keep it light); Return ValidationResult with:
        - ok true + normalized args
        - ok false + missing + errors + (if possible) one clarifyingQuestion

# 6. Permissions
- If permissions.rooms exists, deny execution outside allowed rooms.
- Roles are optional; implement a pluggable permission provider hook. Default allow if not configured.

# 7. Confirmation
- If sideEffects exist OR confirm=always, require confirmation before executing.
- Confirmation uses propose→confirm pipeline:
    - propose() returns a preview of the canonical invocation and asks “Run it? (yes/no)”
    - confirm() executes on yes, cancels on no/cancel
- confirm() only triggers if there is a pending confirmation for that user+room key.

# 8. Middleware Integration

The command subsystem integrates with Hubot's receive middleware to intercept and handle commands:

- **Confirmation Middleware**: Intercepts confirmation replies (yes/no/cancel) when a pending proposal exists for that user+room
- **Invocation Middleware**: Intercepts command invocations (text starting with command ID or alias) to parse, validate, and execute

These middleware handlers are implemented in `Robot.setupCommandListeners()` and must not interfere with normal chat or legacy `hear`/`respond` listeners. The middleware only acts on addressed messages (those directed at the robot) and commands that have been explicitly registered.

# 9. Bridging (optional but useful)

Allow register(spec, { bridge: “respond” | “hear” | “none” }) such that when bridge is enabled, a legacy listener is registered that delegates into the command system (but still does not swallow normal chat).

# 10. Observability

Emit events through an EventEmitter on robot.commands:
- commands:registered
- commands:updated
- commands:alias_collision_detected
- commands:invocation_parsed
- commands:validation_failed
- commands:proposal_created
- commands:proposal_confirm_requested
- commands:proposal_confirmed
- commands:proposal_cancelled
- commands:executed
- commands:permission_denied
- commands:error

**Logging Strategy**: Fire-and-forget async logging to NDJSON file (`default: .data/commands-events.ndjson`). Each event is written individually and asynchronously. Set `disableLogging: true` during testing to prevent file I/O.

# TDD plan you must follow:
A) Write tests first. Include at least these test scenarios:
- parse() correctly parses quoted args and key:value args- parse() resolves command aliases to canonical command ids- validate() applies defaults and rejects invalid enum
- user resolver maps a name to a brain user record (use a stub brain)
- propose() creates pending confirmation for side-effect command
- confirm(“yes”) executes, confirm(“no”) cancels
- confirmation listener does nothing if no pending exists

B) Only after tests exist, implement the smallest code to pass them.

C) Refactor as needed to keep code clean, depulication, software design that provides affordances.

Environment for tests:
- Use Node’s built-in test runner (node:test) unless you have a strong reason not to.
- Create minimal “fake robot” and “fake message” objects as needed; do not require a real chat adapter. You can create a dumby one.
- Because we're in an asynchronous environment, tests often "hange". so make sure to use --test-timeout when running node --test or npm test.

Output format:
- Provide the full repository output (tests + implementation + a short README).
- Do not over-engineer; build a clean minimal core with extension hooks.
