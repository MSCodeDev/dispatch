#!/bin/sh
set -eu

echo "[dispatch] Initializing database schema..."
npm run db:push

echo "[dispatch] Starting server..."
exec npm run start
