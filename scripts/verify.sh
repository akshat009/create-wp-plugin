#!/usr/bin/env bash
set -e

# Clear tmp-verify directory
rm -rf ./tmp-verify
mkdir -p ./tmp-verify

echo "==> Scaffolding Fixture Alpha (full)..."
node index.js --yes --name "Fixture Alpha" --prefix fxa --namespace FixtureAlpha \
  --modules admin_settings,shortcode,rest_api,ajax_handler,cpt_taxonomy,cron,elementor_widget,woocommerce_hooks \
  --react --out ./tmp-verify/full

echo "==> Scaffolding Fixture Beta (minimal)..."
node index.js --yes --name "Fixture Beta" --prefix fxb --namespace FixtureBeta \
  --modules "" --no-react --out ./tmp-verify/minimal

echo "==> Scaffolding Fixture Gamma (elementor)..."
node index.js --yes --name "Fixture Gamma" --prefix fxg --namespace FixtureGamma \
  --modules elementor_widget --min-php 8.2 --no-react --out ./tmp-verify/elementor

VARIANTS=("full" "minimal" "elementor")

for var in "${VARIANTS[@]}"; do
  echo "=========================================="
  echo "Verifying variant: $var"
  echo "=========================================="
  DIR="./tmp-verify/$var"

  echo "-> Running php -l on all PHP files..."
  find "$DIR" -name "*.php" -not -path "*/vendor/*" -exec php -l {} +

  echo "-> Running composer install & composer lint..."
  (cd "$DIR" && composer install --no-interaction && composer lint)

  echo "-> Running composer test..."
  (cd "$DIR" && composer test)

  echo "-> Checking for TODO: SECURITY..."
  if grep -rn --exclude-dir=vendor --exclude-dir=node_modules "TODO: SECURITY" "$DIR"; then
    echo "WARNING: Found TODO: SECURITY in $DIR (Group 6 target)"
  fi

  echo "-> Checking for unreplaced tokens..."
  UNREPLACED=$(grep -rnE '\{\{[A-Z_]+\}\}' --exclude-dir=vendor --exclude-dir=node_modules "$DIR" | grep -vE '\{\{(WRAPPER|VALUE)\}\}' || true)
  if [ -n "$UNREPLACED" ]; then
    echo "ERROR: Unreplaced tokens found in $DIR:"
    echo "$UNREPLACED"
    exit 1
  fi

  echo "Variant $var passed all checks!"
done

echo "=========================================="
echo "All verification variants passed successfully!"
echo "=========================================="
