#!/usr/bin/env bash
# Deliberately no `set -e`: variants are verified independently below so one
# flaky/failing variant (e.g. a Windows AV lock during composer install)
# doesn't hide results for the other four. Failures are collected and the
# script exits non-zero at the end if anything genuinely failed.

# `composer install` can fail transiently on any OS (a network blip against
# packagist, or — very commonly on Windows — antivirus/Search Indexer briefly
# locking a just-extracted vendor file mid-install). Retry a few times with a
# short backoff before giving up for real.
retry_composer_install() {
  local attempt=1
  local max_attempts=8
  until composer install --no-interaction; do
    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "ERROR: composer install failed after $max_attempts attempts."
      return 1
    fi
    echo "composer install failed (attempt $attempt/$max_attempts) — cleaning vendor/ and retrying in 10s..."
    # A locked file from the failed extraction can otherwise poison every
    # subsequent attempt too — start each retry from a clean slate.
    rm -rf vendor composer.lock
    attempt=$((attempt + 1))
    sleep 10
  done
}

# Clear tmp-verify directory
rm -rf ./tmp-verify
mkdir -p ./tmp-verify

echo "==> Scaffolding Fixture Beta (minimal)..."
node index.js --yes --name "Fixture Beta" --prefix fxbb --namespace FixtureBeta \
  --modules "" --no-react --out ./tmp-verify/minimal

echo "==> Scaffolding Fixture Gamma (elementor)..."
node index.js --yes --name "Fixture Gamma" --prefix fxgg --namespace FixtureGamma \
  --modules elementor_widget --min-php 8.2 --no-react --out ./tmp-verify/elementor

echo "==> Scaffolding Fixture Delta (woocommerce only, isolates the 5-way provider split)..."
node index.js --yes --name "Fixture Delta" --prefix fxdd --namespace FixtureDelta \
  --modules woocommerce_hooks --no-react --out ./tmp-verify/woo

echo "==> Scaffolding Fixture Epsilon (VIP lint target)..."
node index.js --yes --name "Fixture Epsilon" --prefix fxee --namespace FixtureEpsilon \
  --modules admin_settings,cpt_taxonomy --no-react --lint-target vip --out ./tmp-verify/vip

echo "==> Scaffolding Fixture Alpha (full — largest dependency set, verified last)..."
node index.js --yes --name "Fixture Alpha" --prefix fxaa --namespace FixtureAlpha \
  --modules admin_settings,shortcode,rest_api,ajax_handler,cpt_taxonomy,cron,caching,custom_table,elementor_widget,woocommerce_hooks \
  --react --out ./tmp-verify/full

# Smallest/fastest first so a slow or flaky "full" install never prevents the
# other four from being checked.
VARIANTS=("minimal" "elementor" "woo" "vip" "full")
FAILED_VARIANTS=()

for var in "${VARIANTS[@]}"; do
  echo "=========================================="
  echo "Verifying variant: $var"
  echo "=========================================="
  DIR="./tmp-verify/$var"
  variant_ok=1

  echo "-> Running php -l on all PHP files..."
  find "$DIR" -name "*.php" -not -path "*/vendor/*" -exec php -l {} + || variant_ok=0

  echo "-> Running composer install & composer lint..."
  (cd "$DIR" && retry_composer_install && composer lint) || variant_ok=0

  echo "-> Running composer test..."
  (cd "$DIR" && composer test) || variant_ok=0

  echo "-> Checking for TODO: SECURITY..."
  if grep -rn --exclude-dir=vendor --exclude-dir=node_modules "TODO: SECURITY" "$DIR"; then
    echo "WARNING: Found TODO: SECURITY in $DIR (Group 6 target)"
  fi

  echo "-> Checking for unreplaced tokens..."
  UNREPLACED=$(grep -rnE '\{\{[A-Z_]+\}\}' --exclude-dir=vendor --exclude-dir=node_modules "$DIR" | grep -vE '\{\{(WRAPPER|VALUE)\}\}' || true)
  if [ -n "$UNREPLACED" ]; then
    echo "ERROR: Unreplaced tokens found in $DIR:"
    echo "$UNREPLACED"
    variant_ok=0
  fi

  if [ "$variant_ok" -eq 1 ]; then
    echo "Variant $var passed all checks!"
  else
    echo "Variant $var FAILED (see above)."
    FAILED_VARIANTS+=("$var")
  fi
done

echo "=========================================="
if [ ${#FAILED_VARIANTS[@]} -eq 0 ]; then
  echo "All verification variants passed successfully!"
  exit 0
else
  echo "FAILED variants: ${FAILED_VARIANTS[*]}"
  exit 1
fi
