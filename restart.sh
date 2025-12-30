#!/bin/bash

# Restart Jekyll development server
# - Kills any running Jekyll server
# - Cleans theme's _site directory to prevent gemspec errors
# - Starts Jekyll with rbenv Ruby

echo "🔄 Restarting Jekyll server..."

# Kill any running Jekyll server
pkill -f "jekyll serve" 2>/dev/null && echo "✓ Stopped existing server"

# Clean theme's _site directory
if [ -d "../modern-resume-theme/_site" ]; then
  rm -rf ../modern-resume-theme/_site
  echo "✓ Cleaned theme _site directory"
fi

# Initialize rbenv and start server
echo "✓ Starting server..."
eval "$(rbenv init - bash)" 2>/dev/null
bundle exec jekyll serve --watch --force_polling --verbose
