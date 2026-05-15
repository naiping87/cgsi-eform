#!/usr/bin/env bash
# ============================================================
# sync-start.sh — 开始工作前同步 Claude Code 项目状态
# 用法: ./scripts/sync-start.sh
# ============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[sync-start]${NC} $*"; }
warn() { echo -e "${YELLOW}[sync-start]${NC} $*"; }
err()  { echo -e "${RED}[sync-start]${NC} $*"; }

PROJECTS_DIR="$HOME/.claude/projects"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

log "Project: $PROJECT_NAME"
log "Project path: $PROJECT_DIR"

# ---- Step 1: Git pull (code + CLAUDE.md + .claude/memory.md) ----
log "Pulling latest code from git..."
cd "$PROJECT_DIR"
if git rev-parse --git-dir > /dev/null 2>&1; then
    git pull --ff-only origin "$(git rev-parse --abbrev-ref HEAD)" 2>&1 || {
        warn "git pull had conflicts or failed — resolve manually if needed"
    }
    log "Git pull complete."
else
    warn "Not a git repository — skipping git pull."
fi

# ---- Step 2: Sync Claude Code conversations ----
log "Checking conversation sync..."

# Detect sync transport
SYNC_METHOD="none"

# Check for Syncthing
if command -v syncthing &>/dev/null || [ -f "$PROJECTS_DIR/.stfolder" ]; then
    SYNC_METHOD="syncthing"
    log "Detected: Syncthing is managing ~/.claude/projects/"
    log "Waiting 5 seconds for Syncthing to finish syncing..."
    sleep 5
    log "Sync should be up to date (Syncthing runs continuously)."
fi

# Check for Dropbox symlink
if [ ! "$SYNC_METHOD" = "syncthing" ]; then
    if [ -L "$PROJECTS_DIR" ]; then
        LINK_TARGET="$(readlink "$PROJECTS_DIR")"
        if echo "$LINK_TARGET" | grep -qi "dropbox\|onedrive\|google"; then
            SYNC_METHOD="cloud-junction"
            log "Detected: ~/.claude/projects/ is a junction to cloud drive: $LINK_TARGET"
            log "Cloud sync should be automatic. Waiting 3 seconds for file system..."
            sleep 3
        fi
    fi
fi

# Check for network share symlink
if [ ! "$SYNC_METHOD" = "syncthing" ] && [ ! "$SYNC_METHOD" = "cloud-junction" ]; then
    if [ -L "$PROJECTS_DIR" ]; then
        LINK_TARGET="$(readlink "$PROJECTS_DIR")"
        SYNC_METHOD="junction"
        log "Detected: ~/.claude/projects/ is a junction to: $LINK_TARGET"
    fi
fi

# Manual sync fallback (Network Share via scripts/sync-share)
if [ "$SYNC_METHOD" = "none" ]; then
    warn "No auto-sync detected (no Syncthing, no symlink to cloud drive)."
    warn "If you configured a network share, run: scripts/sync-share.sh pull"
    warn "Otherwise, conversations will NOT be synced across machines."
fi

# ---- Step 3: Verify project memory ----
if [ -f "$PROJECT_DIR/.claude/memory.md" ]; then
    log "Project memory (.claude/memory.md) is present."
else
    warn "No .claude/memory.md found — create one to persist project knowledge across sessions."
fi

# ---- Step 4: Show status ----
PROJECT_HASH_DIR=""
for d in "$PROJECTS_DIR"/*/; do
    dir_name="$(basename "$d")"
    # Match by project name (last segment of path)
    if echo "$dir_name" | grep -qi "$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]')"; then
        PROJECT_HASH_DIR="$d"
        break
    fi
done

if [ -n "$PROJECT_HASH_DIR" ]; then
    SESSION_COUNT=$(find "$PROJECT_HASH_DIR" -maxdepth 1 -name "*.jsonl" | wc -l)
    LATEST_SESSION=$(ls -t "$PROJECT_HASH_DIR"/*.jsonl 2>/dev/null | head -1)
    log "Found $SESSION_COUNT session(s) for this project."
    if [ -n "$LATEST_SESSION" ]; then
        LATEST_TIME=$(stat -c %y "$LATEST_SESSION" 2>/dev/null || stat -f %Sm "$LATEST_SESSION" 2>/dev/null || echo "unknown")
        log "Latest session: $(basename "$LATEST_SESSION") ($LATEST_TIME)"
    fi
else
    warn "No existing sessions found for this project — this is expected for a fresh clone."
fi

log "----------------------------------------"
log "Ready to work. Run: claude --continue"
log "Or start a new session: claude"
log "----------------------------------------"
