#!/data/data/com.termux/files/usr/bin/bash

set -euo pipefail

nexora_script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
nexora_repo_root=$(cd -- "$nexora_script_dir/.." && pwd)
nexora_commit_message=${1:-"chore: apply Nexora gallery patch"}

cd "$nexora_repo_root"

nexora_current_branch=$(git branch --show-current)
if [ "$nexora_current_branch" != "main" ]; then
  printf 'Patch dihentikan: branch aktif adalah %s, bukan main.\n' "$nexora_current_branch"
  exit 1
fi

printf 'Menjalankan pemeriksaan lengkap...\n'
npm run check

git add -A

if git diff --cached --quiet; then
  printf 'Tidak ada perubahan baru untuk di-commit.\n'
else
  git commit -m "$nexora_commit_message"
fi

printf 'Mengirim branch main ke GitHub...\n'
git push origin main
printf 'Push selesai. Periksa status deployment Vercel.\n'
