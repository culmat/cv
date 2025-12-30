#!/bin/bash

# Switch modern-resume-theme source in Gemfile and _config.yml

if [ -z "$1" ]; then
  echo "Usage: ./switchtheme.sh <source>"
  echo ""
  echo "Switch the modern-resume-theme source in Gemfile and _config.yml."
  echo ""
  echo "Available sources:"
  echo "  local             - Use local theme from ../modern-resume-theme"
  echo "                      (for development, cannot be committed)"
  echo ""
  echo "  sproogen          - Use original theme from sproogen/modern-resume-theme"
  echo "                      (upstream theme without modifications)"
  echo ""
  echo "  culmat            - Use your fork from culmat/modern-resume-theme"
  echo "                      (production deployment with your customizations)"
  echo ""
  echo "  <github-account>  - Use any GitHub account's fork"
  echo ""
  echo "Examples:"
  echo "  ./switchtheme.sh local      # Switch to local development"
  echo "  ./switchtheme.sh culmat     # Switch to your fork (production)"
  echo "  ./switchtheme.sh sproogen   # Switch to original theme"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 CURRENT THEME STATUS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Check current configuration
  CURRENT_SOURCE="unknown"
  COMMIT_STATUS="❓ Unknown"

  # Check Gemfile first (more reliable indicator)
  if grep -q 'path:.*modern-resume-theme' Gemfile; then
    CURRENT_SOURCE="local"
    COMMIT_STATUS="❌ NOT OK to commit (breaks GitHub Pages)"
  elif grep -q 'github:.*modern-resume-theme' Gemfile; then
    GITHUB_ACCOUNT=$(grep 'github:' Gemfile | sed 's/.*github: "\([^"]*\).*/\1/' | sed 's/\/modern-resume-theme//' | head -1)
    CURRENT_SOURCE="remote ($GITHUB_ACCOUNT)"
    COMMIT_STATUS="✅ OK to commit"
  else
    # No gem in Gemfile, check _config.yml for remote_theme
    if grep -q '^remote_theme:' _config.yml; then
      REMOTE_THEME=$(grep '^remote_theme:' _config.yml | sed 's/remote_theme: //' | sed 's/\/modern-resume-theme//')
      CURRENT_SOURCE="remote ($REMOTE_THEME)"
      COMMIT_STATUS="✅ OK to commit"
    fi
  fi

  # Check Gemfile configuration description
  if grep -q 'path:.*modern-resume-theme' Gemfile; then
    GEM_SOURCE="local path"
  elif grep -q 'github:.*modern-resume-theme' Gemfile; then
    GEM_SOURCE="GitHub ($(grep 'github:' Gemfile | sed 's/.*github: "\([^"]*\).*/\1/' | sed 's/\/modern-resume-theme//' | head -1))"
  else
    GEM_SOURCE="none (using remote_theme)"
  fi

  echo "Current theme source: $CURRENT_SOURCE"
  echo "Gemfile configuration: $GEM_SOURCE"
  echo "Commit status: $COMMIT_STATUS"
  echo ""

  if [ "$CURRENT_SOURCE" = "local" ]; then
    echo "╭─ Recommendation ─────────────────────────────────────╮"
    echo "│ Switch to production before committing:             │"
    echo "│                                                     │"
    echo "│   ./switchtheme.sh culmat   # Your fork            │"
    echo "│   ./switchtheme.sh sproogen # Original theme       │"
    echo "╰─────────────────────────────────────────────────────╯"
  fi

  echo ""
  echo "After switching, the script will:"
  echo "  1. Update Gemfile and _config.yml"
  echo "  2. Delete Gemfile.lock"
  echo "  3. Run bundle install"
  exit 0
fi

SOURCE="$1"

echo "🔄 Switching modern-resume-theme source to: $SOURCE"
echo ""

# Backup files
cp Gemfile Gemfile.backup
cp _config.yml _config.yml.backup

# Determine the new configurations
if [ "$SOURCE" = "local" ]; then
  GEM_LINE='gem "modern-resume-theme", path: "../modern-resume-theme"'
  CONFIG_LINE='theme: modern-resume-theme'
  REMOTE_LINE=''
  WARNING="⚠️  WARNING: Local theme is for development only and cannot be committed."
else
  GEM_LINE=''  # No gem needed for remote_theme
  CONFIG_LINE=''
  REMOTE_LINE="remote_theme: $SOURCE/modern-resume-theme"
  WARNING=""
fi

# Update Gemfile
# First, remove any existing modern-resume-theme lines
sed -i '' '/modern-resume-theme/d' Gemfile

# Then add the new line after github-pages gem (if GEM_LINE is not empty)
if [ -n "$GEM_LINE" ]; then
  if grep -q 'gem "github-pages"' Gemfile; then
    sed -i '' '/gem "github-pages"/a\
'"$GEM_LINE"'
' Gemfile
    echo "✓ Updated Gemfile:"
    echo "  $GEM_LINE"
  else
    echo "❌ Could not find github-pages gem in Gemfile"
    rm Gemfile.backup _config.yml.backup
    exit 1
  fi
else
  echo "✓ Updated Gemfile: (no theme gem needed for remote_theme)"
fi

# Update _config.yml
# First, remove any existing theme/remote_theme lines in the build settings section
sed -i '' '/^theme: modern-resume-theme/d' _config.yml
sed -i '' '/^remote_theme:/d' _config.yml
sed -i '' '/^# theme: modern-resume-theme/d' _config.yml
sed -i '' '/^# remote_theme:/d' _config.yml

# Then add the new lines in the build settings section
if grep -q '# Build settings' _config.yml; then
  if [ -n "$CONFIG_LINE" ]; then
    sed -i '' '/# Build settings/a\
'"$CONFIG_LINE"'
' _config.yml
  fi
  if [ -n "$REMOTE_LINE" ]; then
    sed -i '' '/# Build settings/a\
'"$REMOTE_LINE"'
' _config.yml
  fi
  echo "✓ Updated _config.yml:"
  if [ -n "$CONFIG_LINE" ]; then
    echo "  $CONFIG_LINE"
  fi
  if [ -n "$REMOTE_LINE" ]; then
    echo "  $REMOTE_LINE"
  fi
else
  echo "❌ Could not find '# Build settings' in _config.yml"
  rm Gemfile.backup _config.yml.backup
  exit 1
fi

if [ -n "$WARNING" ]; then
  echo ""
  echo "$WARNING"
fi

# Delete Gemfile.lock
if [ -f "Gemfile.lock" ]; then
  rm Gemfile.lock
  echo "✓ Deleted Gemfile.lock"
fi

# Run bundle install (only if not local, since local doesn't need bundle)
if [ "$SOURCE" != "local" ]; then
  echo ""
  echo "📦 Running bundle install..."
  echo ""

  eval "$(rbenv init - bash)" 2>/dev/null
  bundle install

  if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Bundle install failed. Restoring files from backup."
    mv Gemfile.backup Gemfile
    mv _config.yml.backup _config.yml
    exit 1
  fi
else
  echo "✓ Skipping bundle install for local theme"
fi

# Clean up backups
rm Gemfile.backup _config.yml.backup

echo ""
echo "✅ Theme switched successfully to: $SOURCE"
echo ""
echo "Next steps:"
echo "  - Restart Jekyll server with: ./restart.sh"
