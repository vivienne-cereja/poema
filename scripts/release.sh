#!/bin/sh
# builds release/poema-<version>-linux-x64.tar.gz: electron itself, renamed to
# poema, with the poem beside it in resources/app carrying only what it needs
# to run, plus the desktop file and the icon
set -eu
cd "$(dirname "$0")/.."

version=$(node -p 'require("./package.json").version')
name="poema-$version-linux-x64"
out="release/$name"

rm -rf "$out" "release/$name.tar.gz"
mkdir -p "$out"

cp -a node_modules/electron/dist/. "$out/"
mv "$out/electron" "$out/poema"
rm -f "$out/resources/default_app.asar"

app="$out/resources/app"
mkdir -p "$app"
cp -a package.json package-lock.json src assets "$app/"
(cd "$app" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund --silent)
rm "$app/package-lock.json"

cp assets/poema.desktop assets/poema.png README.md "$out/"

tar -C release -czf "release/$name.tar.gz" "$name"
echo "release/$name.tar.gz"
