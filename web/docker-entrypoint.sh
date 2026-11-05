#!/bin/sh
set -e

# Executed automatically by the official nginx image entrypoint through /docker-entrypoint.d/*.sh before nginx starts.
# Generate runtime config.js from environment variables. Each analytics provider has an independent variable;
# unset providers remain disabled, load no scripts, and send no external requests. Multiple providers may be enabled together.

# GA4 and Baidu IDs contain only letters, numbers, and hyphens. Remove other characters
# so quotes and similar values cannot break the JavaScript strings in config.js as a defense-in-depth measure.
sanitize_id() {
    printf '%s' "$1" | tr -cd 'A-Za-z0-9-'
}

GA4_ID=$(sanitize_id "${ANALYTICS_GA4_ID:-}")
BAIDU_ID=$(sanitize_id "${ANALYTICS_BAIDU_ID:-}")

# Model gateway values: a deployment can start with its Base URL, key and
# model list already filled in. Keep only characters an endpoint, key or
# model id can contain so no value can break the generated JavaScript.
sanitize_value() {
    printf '%s' "$1" | tr -cd 'A-Za-z0-9._~:/@+,-'
}

AI_BASE_URL=$(sanitize_value "${MAGPIE_BASE_URL:-}")
AI_API_KEY=$(sanitize_value "${MAGPIE_API_KEY:-}")
AI_IMAGE_MODELS=$(sanitize_value "${MAGPIE_IMAGE_MODELS:-}")
AI_TEXT_MODEL=$(sanitize_value "${MAGPIE_TEXT_MODEL:-}")
AI_DEFAULT_IMAGE_MODEL=$(sanitize_value "${MAGPIE_DEFAULT_IMAGE_MODEL:-}")

cat > /usr/share/nginx/html/config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  ANALYTICS_GA4_ID: "${GA4_ID}",
  ANALYTICS_BAIDU_ID: "${BAIDU_ID}",
  AI_CONFIG: {
    baseUrl: "${AI_BASE_URL}",
    apiKey: "${AI_API_KEY}",
    imageModels: "${AI_IMAGE_MODELS}",
    textModel: "${AI_TEXT_MODEL}",
    defaultImageModel: "${AI_DEFAULT_IMAGE_MODEL}"
  }
};
EOF
