#!/usr/bin/env bash
set -euo pipefail

[[ $# -eq 1 && $1 =~ ^[0-9a-f]{40}$ ]] || {
  echo "usage: $0 <40-character main commit SHA>" >&2
  exit 64
}

exec ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
  -i /home/kit-cursor/.ssh/kitstroit-deploy \
  root@31.77.158.187 "/usr/local/sbin/kitstroit-deploy $1"
