#!/usr/bin/env bash
set -euo pipefail

allow_no_checks=false
if [[ ${1:-} == --allow-no-checks ]]; then
  allow_no_checks=true
  shift
fi
[[ $# -eq 1 && $1 =~ ^[0-9]+$ ]] || {
  echo "usage: $0 [--allow-no-checks] <PR-number>" >&2
  exit 64
}

pr=$1
read -r mergeable state checks <<EOF
$(gh pr view "$pr" --repo kirillbelykh/kitstroit --json mergeable,mergeStateStatus,statusCheckRollup --jq '[.mergeable, .mergeStateStatus, (.statusCheckRollup | length)] | @tsv')
EOF
[[ $mergeable == MERGEABLE && $state == CLEAN ]] || {
  echo "PR #$pr is not mergeable and clean (mergeable=$mergeable state=$state)" >&2
  exit 1
}
if (( checks == 0 )); then
  $allow_no_checks || {
    echo "PR #$pr has no reported checks; rerun only after owner approval with --allow-no-checks" >&2
    exit 1
  }
else
  gh pr checks "$pr" --repo kirillbelykh/kitstroit --required >/dev/null
fi

gh pr merge "$pr" --repo kirillbelykh/kitstroit --squash --delete-branch
