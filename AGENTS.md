# AGENTS.md

<!-- CUSTOMIZE: Replace bracketed items with your project specifics -->

## Project Overview

- **Name**: [Gitlab Insights]
- **Language**: [TypeScript]
- **Key Paths**: `src/`, `prisma`, `tests/`, `docs/`

______________________________________________________________________

## RULE 1 – ABSOLUTE (DO NOT EVER VIOLATE THIS)

You may NOT delete any file or directory unless the user explicitly gives the exact command **in this session**.

- This includes files you just created (tests, tmp files, scripts, etc.)
- You do not get to decide that something is "safe" to remove
- If you think something should be removed, stop and ask

Treat "never delete files without permission" as a hard invariant.

______________________________________________________________________

## Irreversible Git & Filesystem Actions

Absolutely forbidden unless the user gives **exact command and explicit approval** in the same message:

- `git reset --hard`
- `git clean -fd`
- git stash
- jj restore
- `rm -rf`
- Any command that can delete or overwrite code/data

Rules:

1. If you are not 100% sure what a command will delete, do not run it. Ask first.
1. Prefer safe tools: `jj status`, `jj diff`, copying to backups.
1. After approval, restate the command verbatim, list what it will affect, wait for confirmation.

______________________________________________________________________

## Code Editing Discipline

- Do **not** run scripts that bulk-modify code (codemods, one-off scripts, giant sed/regex refactors)
- Large mechanical changes: break into smaller, explicit edits and review diffs
- Subtle/complex changes: edit by hand, file-by-file, with careful reasoning

______________________________________________________________________

## Configuration Reference

<!-- CUSTOMIZE: Update paths based on what you've configured -->

Your configuration is split across these locations:

| Location | Purpose | When to Use |
|----------|---------|-------------|
| `CLAUDE.md` | Project context, architecture | Understanding the codebase |
| `AGENTS.md` | This file - workflow instructions | Session startup, tool usage |
| `.claude/rules/` | Constraints and conventions | Auto-loaded, always follow |
| `.claude/skills/` | Detailed guides and capabilities | Reference when relevant |
| `.claude/commands/` | Slash commands | Invoke with `/command-name` |

### Rules (Auto-Loaded)

Rules in `.claude/rules/*.md` are automatically enforced. Check what's there:

- `safety.md` — File deletion, destructive commands
- `jj-vcs/` - How to use jj in place of git

### Skills (On-Demand)

Skills in `.claude/skills/*/SKILL.md` provide detailed guidance. Use them when:

- The skill's description matches your current task
- You need detailed patterns or examples

Available skills:

- \[List your skills here, e.g., `style-guide` — Code conventions\]

### Commands (User-Triggered)

Slash commands in `.claude/commands/*.md`:

- \[List your commands here, e.g., `/audit-style <path>` — Check code style\]

______________________________________________________________________

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
1. Claim: `bd update <id> --status in_progress`
1. Implement + test
1. Discovered work: `bd create "..." && bd dep add <new> <current> --type discovered-from`
1. Close: `bd close <id> --reason "..."`
1. Commit `.beads/` in the same commit as code changes

Never:

- Use markdown TODO lists
- Use other trackers
- Duplicate tracking

______________________________________________________________________

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

______________________________________________________________________

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

______________________________________________________________________

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

______________________________________________________________________

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

______________________________________________________________________

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

______________________________________________________________________

## Session Workflow

### Session Naming (Claude Code 2.0.64+)

Name sessions immediately after Agent Mail registration for traceability:

```
{project}-{AgentMailName}-{YYYYMMDD-HHMMSS}
```

Examples:

- `myapp-GreenCastle-20251210-143022`
- `backend-BlueLake-20251210-091500`

After `register_agent` or `macro_start_session` returns your agent name:

```bash
/rename myapp-GreenCastle-20251210-143022
```

To resume later:

```bash
claude --resume myapp-GreenCastle-20251210-143022
# Or use /resume in REPL
```

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
jj commit -m "<message>" 
release_file_reservations(...)     # If multi-agent
```

______________________________________________________________________

## Contribution Policy

<!-- CUSTOMIZE as needed -->

Remove any mention of contributing/contributors from README if not applicable.

<!-- bv-agent-instructions-v1 -->

---

## Beads Workflow Integration

This project uses [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) for issue tracking. Issues are stored in `.beads/` and tracked in git.

### Essential Commands

```bash
# View issues (launches TUI - avoid in automated sessions)
bv

# CLI commands for agents (use these instead)
bd ready              # Show issues ready to work (no blockers)
bd list --status=open # All open issues
bd show <id>          # Full issue details with dependencies
bd create --title="..." --type=task --priority=2
bd update <id> --status=in_progress
bd close <id> --reason="Completed"
bd close <id1> <id2>  # Close multiple issues at once
bd sync               # Commit and push changes
```

### Workflow Pattern

1. **Start**: Run `bd ready` to find actionable work
2. **Claim**: Use `bd update <id> --status=in_progress`
3. **Work**: Implement the task
4. **Complete**: Use `bd close <id>`
5. **Sync**: Always run `bd sync` at session end

### Key Concepts

- **Dependencies**: Issues can block other issues. `bd ready` shows only unblocked work.
- **Priority**: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (use numbers, not words)
- **Types**: task, bug, feature, epic, question, docs
- **Blocking**: `bd dep add <issue> <depends-on>` to add dependencies

### Session Protocol

**Before ending any session, run this checklist:**

```bash
git status              # Check what changed
git add <files>         # Stage code changes
bd sync                 # Commit beads changes
git commit -m "..."     # Commit code
bd sync                 # Commit any new beads changes
git push                # Push to remote
```

### Best Practices

- Check `bd ready` at session start to find available work
- Update status as you work (in_progress → closed)
- Create new issues with `bd create` when you discover tasks
- Use descriptive titles and set appropriate priority/type
- Always `bd sync` before ending session

<!-- end-bv-agent-instructions -->
