#!/usr/bin/env bash
set -euo pipefail

[[ $# -eq 1 && $1 =~ ^[0-9a-f]{40}$ ]] || {
  echo "usage: $0 <40-character main commit SHA>" >&2
  exit 64
}

exec sudo -n /srv/kit-ai/bin/kit-deploy "$1"
