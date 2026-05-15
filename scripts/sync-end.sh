#!/usr/bin/env bash
# ============================================================
# sync-end.sh — 结束工作时同步 Claude Code 状态到其他机器
# 用法: ./scripts/sync-end.sh
# ============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[sync-end]${NC} $*"; }
warn() { echo -e "${YELLOW}[sync-end]${NC} $*"; }
err()  { echo -e "${RED}[sync-end]${NC} $*"; }

PROJECTS_DIR="$HOME/.claude/projects"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

log "Project: $PROJECT_NAME"

# ---- Step 1: Git commit & push ----
log "Checking for uncommitted changes..."
cd "$PROJECT_DIR"
if git rev-parse --git-dir > /dev/null 2>&1; then
    if [ -n "$(git status --porcelain)" ]; then
        log "Uncommitted changes detected:"
        git status --short
        echo ""
        read -r -p "Commit message (leave empty to skip): " COMMIT_MSG
        if [ -n "$COMMIT_MSG" ]; then
            git add -A
            git commit -m "$COMMIT_MSG"
            git push origin "$(git rev-parse --abbrev-ref HEAD)" 2>&1 || {
                err "git push failed — resolve and re-run."
                exit 1
            }
            log "Code pushed to remote."
        else
            warn "Skipping git commit (no message provided)."
            warn "Uncommitted changes will NOT be available on other machines."
        fi
    else
        log "No uncommitted changes."
    fi
else
    warn "Not a git repository — skipping git push."
fi

# ---- Step 2: Force conversation sync ----
log "Syncing conversations..."

SYNC_METHOD="none"

# Syncthing: trigger a rescan
if command -v syncthing &>/dev/null || [ -f "$PROJECTS_DIR/.stfolder" ]; then
    SYNC_METHOD="syncthing"
    log "Syncthing detected — triggering rescan..."
    if command -v syncthing &>/dev/null; then
        syncthing cli rescan "$PROJECTS_DIR" 2>/dev/null || true
    fi
    log "Waiting 10 seconds for Syncthing to push changes to peers..."
    sleep 10
    log "Conversations synced via Syncthing."
fi

# Cloud junction: no action needed (real-time sync)
if [ ! "$SYNC_METHOD" = "syncthing" ]; then
    if [ -L "$PROJECTS_DIR" ]; then
        LINK_TARGET="$(readlink "$PROJECTS_DIR")"
        if echo "$LINK_TARGET" | grep -qi "dropbox\|onedrive\|google"; then
            SYNC_METHOD="cloud-junction"
            log "Cloud junction detected — files sync automatically."
            log "Waiting 5 seconds for cloud upload..."
            sleep 5
            log "Conversations should be uploaded."
        fi
    fi
fi

if [ "$SYNC_METHOD" = "none" ]; then
    warn "No auto-sync detected. Conversations are only on this machine."
    warn "Set up Syncthing or a cloud junction to sync across machines."
    warn "See: docs/cross-machine-sync.md"
fi

# ---- Step 3: Summary ----
log "----------------------------------------"
log "Done. Status:"
log "  Code: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'N/A') @ $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
log "  Sync method: $SYNC_METHOD"
log "----------------------------------------"
log "Safe to switch to another machine."
if [ "$SYNC_METHOD" = "none" ]; then
    warn "BUT: conversations are NOT synced. Set up sync transport."
fi
