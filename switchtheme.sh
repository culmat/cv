#!/bin/bash

# Switch modern-resume-theme source in Gemfile

if [ -z "$1" ]; then
  echo "Usage: ./switchtheme.sh <source>"
  echo ""
  echo "Switch the modern-resume-theme source in Gemfile."
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
  echo "After switching, the script will:"
  echo "  1. Update Gemfile"
  echo "  2. Delete Gemfile.lock"
  echo "  3. Run bundle install"
  exit 0
fi

SOURCE="$1"

echo "🔄 Switching modern-resume-theme source to: $SOURCE"
echo ""

# Backup Gemfile
cp Gemfile Gemfile.backup

# Determine the new gem line
if [ "$SOURCE" = "local" ]; then
  NEW_LINE='gem "modern-resume-theme", path: "../modern-resume-theme"'
  WARNING="⚠️  WARNING: Local theme is for development only and cannot be committed."
else
  NEW_LINE="gem \"modern-resume-theme\", github: \"$SOURCE/modern-resume-theme\""
  WARNING=""
fi

# Replace the line in Gemfile
if grep -q 'gem "modern-resume-theme"' Gemfile; then
  # Use sed to replace the line (macOS-compatible)
  sed -i '' '/gem "modern-resume-theme"/c\
'"$NEW_LINE"'
' Gemfile

  echo "✓ Updated Gemfile:"
  echo "  $NEW_LINE"
  echo ""

  if [ -n "$WARNING" ]; then
    echo "$WARNING"
    echo ""
  fi

  # Delete Gemfile.lock
  if [ -f "Gemfile.lock" ]; then
    rm Gemfile.lock
    echo "✓ Deleted Gemfile.lock"
  fi

  # Run bundle install
  echo ""
  echo "📦 Running bundle install..."
  echo ""

  eval "$(rbenv init - bash)" 2>/dev/null
  bundle install

  # Clean up backup if successful
  if [ $? -eq 0 ]; then
    rm Gemfile.backup
    echo ""
    echo "✅ Theme switched successfully to: $SOURCE"
    echo ""
    echo "Next steps:"
    echo "  - Restart Jekyll server with: ./restart.sh"
  else
    echo ""
    echo "❌ Bundle install failed. Restoring Gemfile from backup."
    mv Gemfile.backup Gemfile
    exit 1
  fi
else
  echo "❌ Could not find modern-resume-theme gem in Gemfile"
  rm Gemfile.backup
  exit 1
fi
