#!/usr/bin/env bash
# ============================================================
# sync-setup.sh — 一次性设置跨机器同步
# 用法: ./scripts/sync-setup.sh [syncthing|dropbox|network]
# ============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[sync-setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[sync-setup]${NC} $*"; }
err()  { echo -e "${RED}[sync-setup]${NC} $*"; }

METHOD="${1:-}"
PROJECTS_DIR="$HOME/.claude/projects"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "=============================================="
echo " Claude Code Cross-Machine Sync Setup"
echo "=============================================="
echo ""

# ---- Verify project path ----
log "Project path: $PROJECT_DIR"
log "This path MUST be identical on all 3 machines."
echo ""

# ---- Step 1: Commit .claude to git ----
log "Committing .claude/ files to git..."
cd "$PROJECT_DIR"
if [ ! -f ".claude/memory.md" ]; then
    echo "# Project Memory for $(basename "$PROJECT_DIR")" > .claude/memory.md
    log "Created .claude/memory.md"
fi
git add .claude/memory.md .claude/settings.json .claude/skills/ 2>/dev/null || true
if git diff --cached --quiet; then
    log ".claude/ files already committed."
else
    git commit -m "add claude project memory, settings, and skills to git"
    git push origin "$(git rev-parse --abbrev-ref HEAD)"
    log "Pushed .claude/ files to remote."
fi

echo ""

# ---- Step 2: Configure sync transport ----
if [ -z "$METHOD" ]; then
    echo "Choose sync transport:"
    echo "  1) Syncthing  — P2P, LAN, free, automatic"
    echo "  2) Dropbox    — Cloud, simple, uses symlink"
    echo "  3) OneDrive   — Cloud, same as Dropbox"
    echo "  4) Skip       — I'll set up manually"
    read -r -p "Choice [1-4]: " CHOICE
    case "$CHOICE" in
        1) METHOD="syncthing" ;;
        2) METHOD="dropbox" ;;
        3) METHOD="onedrive" ;;
        4) METHOD="skip" ;;
        *) err "Invalid choice"; exit 1 ;;
    esac
fi

case "$METHOD" in
syncthing)
    log "Syncthing setup:"
    echo ""
    echo "  1. Download Syncthing from https://syncthing.net/downloads/"
    echo "  2. Install and run it on all 3 machines"
    echo "  3. On this machine, open http://127.0.0.1:8384"
    echo "  4. Add Folder:"
    echo "     - Folder ID: claude-code-projects"
    echo "     - Folder Path: $PROJECTS_DIR"
    echo "  5. Under 'Sharing', add the other 2 machines' device IDs"
    echo "  6. On the other machines, accept the share"
    echo ""
    log "Once Syncthing is running on all machines, no further action needed."
    log "Conversations sync automatically and continuously."
    ;;

dropbox)
    DROPBOX="$HOME/Dropbox"
    if [ ! -d "$DROPBOX" ]; then
        err "Dropbox folder not found at $DROPBOX"
        err "Install Dropbox first and ensure it's synced."
        exit 1
    fi
    SYNC_DIR="$DROPBOX/claude-projects"
    mkdir -p "$SYNC_DIR"

    if [ -d "$PROJECTS_DIR" ] && [ ! -L "$PROJECTS_DIR" ]; then
        log "Moving existing projects to Dropbox..."
        cp -r "$PROJECTS_DIR"/* "$SYNC_DIR/" 2>/dev/null || true
        rm -rf "$PROJECTS_DIR"
    fi
    if [ -L "$PROJECTS_DIR" ]; then
        rm "$PROJECTS_DIR"
    fi
    cmd //c "mklink /J \"$PROJECTS_DIR\" \"$SYNC_DIR\"" 2>/dev/null || {
        # Fallback for Git Bash: use Windows mklink via cmd
        MSYS_NO_PATHCONV=1 cmd //c "mklink /J \"$(cygpath -w "$PROJECTS_DIR")\" \"$(cygpath -w "$SYNC_DIR")\""
    }
    log "Created junction: $PROJECTS_DIR -> $SYNC_DIR"
    log "Done. Conversations will sync via Dropbox automatically."
    ;;

onedrive)
    ONEDRIVE="$HOME/OneDrive"
    if [ ! -d "$ONEDRIVE" ]; then
        # Check other common OneDrive locations
        ONEDRIVE="$HOME/OneDrive - Personal"
    fi
    if [ ! -d "$ONEDRIVE" ]; then
        err "OneDrive folder not found."
        err "Ensure OneDrive is set up and synced."
        exit 1
    fi
    SYNC_DIR="$ONEDRIVE/claude-projects"
    mkdir -p "$SYNC_DIR"

    if [ -d "$PROJECTS_DIR" ] && [ ! -L "$PROJECTS_DIR" ]; then
        log "Moving existing projects to OneDrive..."
        cp -r "$PROJECTS_DIR"/* "$SYNC_DIR/" 2>/dev/null || true
        rm -rf "$PROJECTS_DIR"
    fi
    if [ -L "$PROJECTS_DIR" ]; then
        rm "$PROJECTS_DIR"
    fi
    MSYS_NO_PATHCONV=1 cmd //c "mklink /J \"$(cygpath -w "$PROJECTS_DIR")\" \"$(cygpath -w "$SYNC_DIR")\""
    log "Created junction: $PROJECTS_DIR -> $SYNC_DIR"
    log "Done. Conversations will sync via OneDrive automatically."
    ;;

skip)
    log "Skipping sync transport setup."
    log "Configure manually. See docs/cross-machine-sync.md"
    ;;

*)
    err "Unknown method: $METHOD"
    exit 1
    ;;
esac

echo ""
log "----------------------------------------"
log "Setup complete!"
log ""
log "On each of the other 2 machines, run this same script:"
log "  1. git clone https://github.com/naiping87/cgsi-eform.git"
log "  2. cd cgsi-eform && ./scripts/sync-setup.sh $METHOD"
log ""
log "Then use daily:"
log "  Start work:  ./scripts/sync-start.sh"
log "  End work:    ./scripts/sync-end.sh"
log "----------------------------------------"
