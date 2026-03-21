#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <username> <password>" >&2
  exit 1
fi

username="$1"
password="$2"
hash=$(openssl passwd -apr1 "$password")
printf '%s:%s\n' "$username" "$hash"
