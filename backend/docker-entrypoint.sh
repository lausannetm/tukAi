#!/bin/sh
set -e

UPLOAD_DIR="${SERVICE_UPLOADS_DIR:-/app/uploads/services}"
mkdir -p "$UPLOAD_DIR"
chown -R nextjs:nodejs "$UPLOAD_DIR"

exec su-exec nextjs:nodejs "$@"
