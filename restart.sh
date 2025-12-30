#!/bin/bash

# Restart Jekyll development server
# - Kills any running Jekyll server
# - Cleans theme's _site directory to prevent gemspec errors
# - Starts Jekyll with Docker

echo "🔄 Restarting Jekyll server..."

# Kill any running Jekyll server
docker compose down 2>/dev/null && echo "✓ Stopped existing server"

# Clean theme's _site directory
if [ -d "../modern-resume-theme/_site" ]; then
  rm -rf ../modern-resume-theme/_site
  echo "✓ Cleaned theme _site directory"
fi

# Start server
echo "✓ Starting server..."
docker compose up
