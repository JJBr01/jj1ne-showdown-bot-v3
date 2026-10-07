#!/usr/bin/env bash
# One-time setup on Linux (e.g. an Azure Ubuntu VM). Needs git + Node.js 22.
set -e
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Install Node.js 22 first (see AZURE.md)"; exit 1; }
[ -d ps ] || git clone --depth 1 https://github.com/smogon/pokemon-showdown.git ps
(cd ps && npm install --omit=dev && node build)
npm install ws @smogon/calc --no-save
echo "Setup complete. Edit config.json, set AZURE_CLAUDE_KEY, then ./run.sh"
