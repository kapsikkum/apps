#!/bin/bash
# One-time: creates the F-Droid repo signing key and stores it as repository secrets.
# The keystore and its password are kept in ../.secrets (gitignored). Back them up.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .secrets
pass=$(head -c 24 /dev/urandom | base64 | tr -d '/+=' | head -c 24)
keytool -genkeypair -keystore .secrets/keystore.jks -alias apps -keyalg RSA -keysize 4096 -validity 10000 \
  -storepass "$pass" -keypass "$pass" -dname "CN=kapsikkum apps" >/dev/null 2>&1
printf '%s' "$pass" > .secrets/keystore-password.txt
base64 -w0 .secrets/keystore.jks | gh secret set FDROID_KEYSTORE_BASE64 -R kapsikkum/apps
printf '%s' "$pass" | gh secret set FDROID_KEYSTORE_PASSWORD -R kapsikkum/apps
echo "key created"
