#!/bin/bash

# Restart Jekyll development server locally with hotreload
# - Checks for Jekyll installation and version
# - Kills any running Jekyll server
# - Cleans theme's _site directory to prevent gemspec errors
# - Starts Jekyll locally with livereload

echo "🔄 Restarting Jekyll server locally with hotreload..."

# Check if Jekyll is installed
if ! command -v jekyll &> /dev/null; then
    echo "❌ Jekyll is not installed."
    echo ""
    echo "Installation hints:"
    echo "1. Install Ruby (if not already installed):"
    echo "   - Ubuntu/Debian: sudo apt-get install ruby-full build-essential zlib1g-dev"
    echo "   - macOS: brew install ruby"
    echo "   - Or use rbenv/rvm for version management"
    echo ""
    echo "2. Install Jekyll:"
    echo "   gem install jekyll bundler"
    echo ""
    echo "3. Install dependencies for this project:"
    echo "   bundle install"
    echo ""
    exit 1
fi

# Check Jekyll version
JEKYLL_VERSION=$(bundle exec jekyll --version 2>/dev/null | grep -oP '\d+\.\d+\.\d+')
if [ -n "$JEKYLL_VERSION" ]; then
    echo "✓ Jekyll version: $JEKYLL_VERSION"
else
    echo "⚠️ Could not determine Jekyll version"
fi

# Kill any running Jekyll server (both local and Docker)
echo "Stopping any existing Jekyll servers..."
docker compose down 2>/dev/null && echo "✓ Stopped Docker Jekyll server"
pkill -f "jekyll serve" 2>/dev/null && echo "✓ Stopped local Jekyll server"

# Wait a moment for ports to be released
sleep 2

# Clean theme's _site directory
if [ -d "../modern-resume-theme/_site" ]; then
  rm -rf ../modern-resume-theme/_site
  echo "✓ Cleaned theme _site directory"
fi

# Install dependencies
echo "Installing dependencies..."
mkdir -p ~/.bundle/cache
export BUNDLE_CACHE_PATH=~/.bundle/cache
bundle install --path vendor/bundle

# Start server with livereload
echo "✓ Starting Jekyll server with hotreload..."
echo "   Server will be available at: http://localhost:4000"
echo "   Press Ctrl+C to stop"
echo ""

bundle exec jekyll serve --livereload --host 0.0.0.0