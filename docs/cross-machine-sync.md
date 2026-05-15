# Cross-Machine Claude Code Sync Guide

## Problem

Three Windows machines, each with Claude Code. Want to resume work on any machine without re-cloning or re-explaining the project.

## What Gets Synced

| Data | Location | Sync Method |
|---|---|---|
| Code | `C:\Users\ediso\cctest\<project>` | `git pull/push` |
| `CLAUDE.md` | `C:\Users\ediso\cctest\<project>\CLAUDE.md` | Git (already tracked) |
| `.claude/memory.md` | `C:\Users\ediso\cctest\<project>\.claude\memory.md` | Git (commit it) |
| `.claude/settings.json` | `C:\Users\ediso\cctest\<project>\.claude\settings.json` | Git (commit it) |
| Conversations | `~/.claude/projects/<path-hash>/` | External sync (see below) |
| `CLAUDE.local.md` | `C:\Users\ediso\cctest\<project>\CLAUDE.local.md` | **Do NOT sync** (machine-specific) |

## Critical: Path Hash

Claude Code stores conversations under `~/.claude/projects/<path-hash>/`. The hash is the project's absolute path with special chars replaced by `-`.

Example:
- `C:\Users\ediso\cctest` → `c--Users-ediso-cctest`
- `C:\Users\ediso\cctest\cgsi-eform` → `c--Users-ediso-cctest-cgsi-eform` (if opened as standalone)

**To make conversations portable, every machine MUST use the same project path.**

For this project, always clone to: `C:\Users\ediso\cctest\cgsi-eform`

---

## Setup (One-Time, per machine)

### Step 1: Ensure identical project paths

On every machine:
```bash
mkdir -p "$HOME/cctest"
cd "$HOME/cctest"
git clone https://github.com/naiping87/cgsi-eform.git
```

### Step 2: Commit project memory to git

On the first machine:
```bash
cd "$HOME/cctest/cgsi-eform"
echo "# Project Memory" > .claude/memory.md
git add .claude/memory.md .claude/settings.json
git commit -m "add claude project memory and settings to git"
git push
```

Then on other machines after `git pull`, Claude Code will pick up `.claude/memory.md` automatically.

### Step 3: Choose and configure sync transport

#### Option A: Syncthing (Recommended — LAN, auto, free)

1. Install Syncthing on all 3 machines: https://syncthing.net/downloads/
2. On Machine A, open Syncthing UI (http://127.0.0.1:8384)
3. Add Folder:
   - Folder ID: `claude-code-projects`
   - Folder Path: `C:\Users\ediso\.claude\projects`
4. Share with Machines B and C (enter their device IDs)
5. On Machines B and C, accept the share, set folder path to their own `C:\Users\ediso\.claude\projects`

Done — conversations sync in real time, no manual steps needed.

#### Option B: Dropbox / OneDrive / Google Drive

1. Move the projects directory into your cloud drive folder:
```bash
# On Machine A (source)
robocopy "$HOME/.claude/projects" "$HOME/Dropbox/claude-projects" /E /MIR
rmdir /s "$HOME/.claude/projects"
mklink /J "$HOME/.claude/projects" "$HOME/Dropbox/claude-projects"
```

2. On Machines B and C:
```bash
rmdir /s "$HOME/.claude/projects"
mklink /J "$HOME/.claude/projects" "$HOME/Dropbox/claude-projects"
```

#### Option C: NAS / Network Share (LAN only)

Mount the NAS share to `Z:\` on all machines, then:
```bash
# Setup (once)
mkdir "Z:\claude-projects"

# On each machine
rmdir /s "$HOME/.claude/projects"
mklink /J "$HOME/.claude/projects" "Z:\claude-projects"
```

Caution: Network latency may affect Claude Code performance. Syncthing is better.

---

## Daily Workflow

### Start Work (run on the machine you're about to use)

```bash
# From Git Bash / WSL
cd "$HOME/cctest/cgsi-eform"
./scripts/sync-start.sh
```

This script:
1. `git pull` — gets latest code + CLAUDE.md + .claude/memory.md
2. Waits for sync to settle (Syncthing) or copies from cloud (Dropbox)
3. Reports: "Ready. Use: claude --continue"

### End Work (run before leaving the machine)

```bash
# From Git Bash / WSL
cd "$HOME/cctest/cgsi-eform"
./scripts/sync-end.sh
```

This script:
1. `git add -A && git commit && git push` — saves code changes
2. Forces sync flush (Syncthing) or copies to cloud (Dropbox)
3. Reports: "Synced. Safe to switch machines."

---

## What `claude --continue` Does

On the new machine, after running `sync-start.sh`:
```
cd C:\Users\ediso\cctest\cgsi-eform
claude --continue
```

Claude Code finds the latest conversation in `~/.claude/projects/c--Users-ediso-cctest-cgsi-eform/` and resumes it — with full context, including project memory from `.claude/memory.md`.

## Scripts

See `scripts/sync-start.sh` and `scripts/sync-end.sh` in this repo.
