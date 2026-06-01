#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${ADMIN_PORTAL_URL:-http://localhost:5174}"

ADMIN_URL="${BASE_URL}/admin/login"
SELLER_URL="${BASE_URL}/seller/login"
DELIVERY_URL="${BASE_URL}/delivery/login"

open_browser() {
  local app_name="$1"
  local url="$2"

  if ! osascript -e "id of application \"${app_name}\"" >/dev/null 2>&1; then
    printf '%s is not installed. Please install it or open this URL manually:\n%s\n' "$app_name" "$url"
    return 0
  fi

  open -na "$app_name" --args "$url" >/dev/null 2>&1 || open -a "$app_name" "$url"
}

open_browser "Google Chrome" "$ADMIN_URL"
open_browser "Firefox" "$SELLER_URL"
open_browser "Safari" "$DELIVERY_URL"

printf 'Opened staff portals:\n'
printf 'Admin:    %s in Google Chrome\n' "$ADMIN_URL"
printf 'Seller:   %s in Firefox\n' "$SELLER_URL"
printf 'Delivery: %s in Safari\n' "$DELIVERY_URL"
