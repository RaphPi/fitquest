#!/bin/sh
set -e
echo " → Applying database schema (prisma db push)..."
npx prisma db push --accept-data-loss
echo " → Starting FitQuest API..."
exec node dist/index.js
