#!/bin/bash
set -e

# Install dependencies
npm install --legacy-peer-deps

# Push database schema (non-interactive)
npm run db:push
