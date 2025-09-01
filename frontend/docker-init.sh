#!/bin/bash
set -e

echo "Starting Next.js application..."

# Set company name from environment variable or use default
COMPANY_NAME="${COMPANY_NAME:-${NEXT_PUBLIC_COMPANY_NAME:-Bialek Company}}"
echo "Using company name: $COMPANY_NAME"

# Replace placeholder in built JavaScript files
echo "Replacing {{COMPANY_NAME}} placeholder in built files..."
find /app/.next -name "*.js" -type f -exec sed -i "s/{{COMPANY_NAME}}/$COMPANY_NAME/g" {} \;
find /app/.next -name "*.html" -type f -exec sed -i "s/{{COMPANY_NAME}}/$COMPANY_NAME/g" {} \;

echo "Replacement complete. Starting application..."
exec npm start
