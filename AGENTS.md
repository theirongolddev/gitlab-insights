# AGENTS.md

<!-- CUSTOMIZE: Replace bracketed items with your project specifics -->

## Project Overview

- **Name**: [Project Name]
- **Language**: [TypeScript/Python/Go/etc.]
- **Key Paths**: `src/`, `tests/`, `docs/`

---

## RULE 1 – ABSOLUTE (DO NOT EVER VIOLATE THIS)

You may NOT delete any file or directory unless the user explicitly gives the exact command **in this session**.

- This includes files you just created (tests, tmp files, scripts, etc.)
- You do not get to decide that something is "safe" to remove
- If you think something should be removed, stop and ask

Treat "never delete files without permission" as a hard invariant.

---

## Irreversible Git & Filesystem Actions

Absolutely forbidden unless the user gives **exact command and explicit approval** in the same message:

- `git reset --hard`
- `git clean -fd`
- `rm -rf`
- Any command that can delete or overwrite code/data

Rules:

1. If you are not 100% sure what a command will delete, do not run it. Ask first.
2. Prefer safe tools: `git status`, `git diff`, `git stash`, copying to backups.
3. After approval, restate the command verbatim, list what it will affect, wait for confirmation.

---

## Code Editing Discipline

- Do **not** run scripts that bulk-modify code (codemods, one-off scripts, giant sed/regex refactors)
- Large mechanical changes: break into smaller, explicit edits and review diffs
- Subtle/complex changes: edit by hand, file-by-file, with careful reasoning

---

## Issue Tracking with bd (Beads)

All issue tracking goes through **bd**. No other TODO systems.

Key invariants:

- `.beads/` is authoritative state and **must always be committed** with code changes
- Do not edit `.beads/*.jsonl` directly; only via `bd`

### Core Commands

```bash
# Finding work
bd ready --json                    # Unblocked tasks ready for work
bd blocked                         # Tasks waiting on dependencies
bd list                            # All tasks

# Task lifecycle
bd create "Title" -t bug -p 1 --estimate 30   # Create with type, priority, estimate
bd update bd-42 --status in_progress          # Claim task
bd close bd-42 --reason "Completed"           # Complete task

# Viewing
bd show bd-42                      # Full task details
bd info                            # Project summary
```

### Dependencies

```bash
bd dep add bd-child bd-blocker --type blocks        # Child blocked by blocker
bd dep add bd-a bd-b --type related                 # Related tasks
bd dep add bd-child bd-parent --type parent-child   # Hierarchy
bd dep add bd-new bd-old --type discovered-from     # Found during work
bd dep tree bd-42                                   # Visualize dependencies
bd dep cycles                                       # Find circular deps
```

### Advanced Features

```bash
bd doctor                          # Health check
bd doctor --fix                    # Auto-fix issues
bd compact --analyze --json        # Analyze for compaction
bd sync                            # Force sync to git
bd --readonly list                 # Safe read-only mode
```

**Types**: `bug`, `feature`, `task`, `epic`, `chore`
**Priority**: `0` (critical) to `4` (backlog)
**Child beads**: `bd-a1b2.1`, `bd-a1b2.3.1` (hierarchical)

### Agent Workflow

1. `bd ready --json` to find unblocked work
2. Claim: `bd update <id> --status in_progress`
3. Implement + test
4. Discovered work: `bd create "..." && bd dep add <new> <current> --type discovered-from`
5. Close: `bd close <id> --reason "..."`
6. Commit `.beads/` in the same commit as code changes

Never:
- Use markdown TODO lists
- Use other trackers
- Duplicate tracking

---

## Using bv as an AI Sidecar

`bv` is a terminal UI + analysis layer for `.beads/`. It precomputes graph metrics.

**Always use robot flags. Never run bare `bv`.**

```bash
bv --robot-help                    # Overview of all robot commands
bv --robot-priority                # Ranked recommendations with confidence
bv --robot-plan                    # Parallel execution tracks
bv --robot-insights                # Graph metrics (PageRank, betweenness, HITS)
bv --robot-recipes                 # List available filter presets
bv --robot-diff --diff-since "1 hour ago"  # What changed recently
bv --robot-diff --diff-since HEAD~5        # Changes in last 5 commits
```

**Graph metrics explained**:
- **PageRank**: Foundational blockers (tasks that enable many others)
- **Betweenness**: Bottlenecks (must pass through these)
- **Critical path**: Longest dependency chain

---

## CASS — Cross-Agent Search

`cass` indexes prior agent conversations so we can reuse solved problems.

**Always use `--robot` or `--json`. Never run bare `cass`.**

### Search

```bash
cass search "query" --robot --limit 5              # Basic search
cass search "query" --robot --fields minimal       # Lean output (path, line, agent)
cass search "query" --robot --fields summary       # Add title, score
cass search "query" --robot --max-tokens 2000      # Token budget
cass search "auth*" --robot                        # Wildcard prefix
```

### View & Expand

```bash
cass view /path/to/session.jsonl --json            # View full session
cass expand /path -n 42 -C 3 --json                # Line 42 with 3 lines context
```

### Timeline & Export

```bash
cass timeline --today --json                       # Today's sessions
cass timeline --since 7d --json                    # Last week
cass export /path/session.jsonl --format markdown  # Export to markdown
```

### Indexing

```bash
cass index --full                  # Rebuild index (if search returns nothing)
```

**Output formats**: `--robot-format jsonl` (streaming), `--robot-format compact` (minimal)

---

## cass-memory — Cross-Agent Learning

Before starting any non-trivial task:

```bash
cm context "your task description" --json
```

This returns:
- **Relevant rules** from the playbook
- **Historical context** from past sessions
- **Anti-patterns** to avoid
- **Suggested searches** for deeper investigation

```bash
cm doctor                          # Health check
```

You do NOT need to:
- Run `cm reflect` (automation handles this)
- Manually add rules to the playbook
- Worry about the learning pipeline

The system learns from your sessions automatically.

---

## UBS — Bug Scanner

### Pre-Commit (Required)

```bash
ubs --staged                       # Scan staged changes
ubs --staged --fail-on-warning     # Strict mode (exit 1 on any issue)
```

### Scanning Options

```bash
ubs .                              # Scan current directory
ubs path/to/file.ts                # Scan specific file
ubs --diff                         # Scan working tree changes vs HEAD
ubs -v .                           # Verbose with code examples
```

### Profiles & Filters

```bash
ubs --profile=strict .             # Fail on warnings
ubs --profile=loose .              # Skip nits (prototyping)
ubs --only=python .                # Single language
ubs --only=typescript,javascript . # Multiple languages
```

**Languages**: javascript, typescript, python, c, c++, rust, go, java, ruby

### Output Formats

```bash
ubs . --format=json                # JSON
ubs . --format=jsonl               # Line-delimited JSON
ubs . --format=sarif               # GitHub Code Scanning
```

### CI Integration

```bash
ubs --ci                           # CI mode
ubs --comparison baseline.json .   # Regression detection
```

**Suppress false positives**: `// ubs:ignore`

**Health check**: `ubs doctor --fix`

---

## MCP Agent Mail — Multi-Agent Coordination

Agent Mail is available as an MCP server for coordinating multiple agents.

### Registration (Required First)

```python
ensure_project(project_key="/abs/path/to/project")
register_agent(project_key, program="claude-code", model="opus-4.5")
# Returns auto-generated name like "GreenCastle"
```

### File Reservations

```python
# Reserve before editing
file_reservation_paths(
    project_key, agent_name,
    paths=["src/**/*.ts"],
    ttl_seconds=3600,
    exclusive=True,
    reason="bd-123"
)

# Extend if needed
renew_file_reservations(project_key, agent_name, extend_seconds=1800)

# Release when done
release_file_reservations(project_key, agent_name)
```

### Messaging

```python
# Send
send_message(
    project_key, sender_name,
    to=["OtherAgent"],
    subject="[bd-123] Starting auth refactor",
    body_md="Working on login module...",
    thread_id="bd-123",
    importance="normal"  # low, normal, high, urgent
)

# Reply
reply_message(project_key, message_id, sender_name, body_md="Done!")

# Check inbox
fetch_inbox(project_key, agent_name, limit=10)
fetch_inbox(project_key, agent_name, urgent_only=True)

# Acknowledge
acknowledge_message(project_key, agent_name, message_id)
```

### Search & Discovery

```python
# Full-text search
search_messages(project_key, query="authentication", limit=20)

# Thread summary
summarize_thread(project_key, thread_id="bd-123")

# Who is this agent?
whois(project_key, agent_name="BlueLake")
```

### Build Coordination

```python
# Acquire build slot (prevents concurrent builds)
acquire_build_slot(project_key, agent_name, slot="main", exclusive=True)
release_build_slot(project_key, agent_name, slot="main")
```

### Quick Start Macros

```python
# Start session with reservation in one call
macro_start_session(
    human_key="/abs/path",
    program="claude-code",
    model="opus-4.5",
    file_reservation_paths=["src/**"],
    inbox_limit=10
)
```

Common pitfalls:
- "from_agent not registered" → call `register_agent` first
- `FILE_RESERVATION_CONFLICT` → wait for expiry or coordinate with holder

---

## Warp-Grep — Parallel Code Search

Warp-Grep runs 8 parallel searches per turn. It's an MCP tool, not a CLI command.

**When to use**:
- "How does X work?" discovery
- Data flow across multiple files
- Cross-cutting concerns

**When NOT to use**:
- You know the function name (use `rg` or Grep tool)
- You know the exact file (just open it)
- Simple existence check

The tool activates automatically for natural language code questions.

---

## Exa MCP — AI Web & Code Search

Exa provides real-time web search and code context retrieval.

**When to use**:
- Current documentation (APIs change after training cutoff)
- Code examples from GitHub/StackOverflow
- Latest library versions or deprecation notices

**Available tools**:
```
web_search_exa        # Real-time web search
get_code_context_exa  # Search GitHub, docs, StackOverflow
deep_search_exa       # Deep research with query expansion
crawling              # Extract content from specific URLs
```

**When NOT to use**:
- Information likely in codebase (use CASS or Warp-Grep)
- Historical context (use cass-memory)
- Task information (use Beads)

---

## Session Workflow

### Start

```bash
bd ready --json                    # Find work
bd update <id> --status in_progress
cm context "task description" --json
```

### During Work

```bash
# If stuck
cass search "similar problem" --robot
bv --robot-priority

# If multi-agent
fetch_inbox(project_key, agent_name)
```

### End

```bash
ubs --staged                       # Scan for bugs
bd close <id> --reason "Completed: ..."
bd sync                            # Sync .beads
git add -A && git commit && git push
release_file_reservations(...)     # If multi-agent
```

---

## Contribution Policy

<!-- CUSTOMIZE as needed -->
Remove any mention of contributing/contributors from README if not applicable.
