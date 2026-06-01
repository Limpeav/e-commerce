#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${ADMIN_PORTAL_URL:-http://localhost:5174}"
CHROME_APP="Google Chrome"

ADMIN_URL="${BASE_URL}/admin/login"
SELLER_URL="${BASE_URL}/seller/login"
DELIVERY_URL="${BASE_URL}/delivery/login"

open_chrome_profile() {
  local profile_name="$1"
  local url="$2"

  if ! osascript -e "id of application \"${CHROME_APP}\"" >/dev/null 2>&1; then
    printf '%s is not installed. Open this URL manually:\n%s\n' "$CHROME_APP" "$url"
    return 0
  fi

  open -na "$CHROME_APP" --args --profile-directory="$profile_name" "$url"
}

open_chrome_profile "Profile 1" "$ADMIN_URL"
open_chrome_profile "Profile 2" "$SELLER_URL"
open_chrome_profile "Profile 3" "$DELIVERY_URL"

printf 'Opened staff portals in separate Chrome profiles:\n'
printf 'Admin:    %s in Chrome Profile 1\n' "$ADMIN_URL"
printf 'Seller:   %s in Chrome Profile 2\n' "$SELLER_URL"
printf 'Delivery: %s in Chrome Profile 3\n' "$DELIVERY_URL"
