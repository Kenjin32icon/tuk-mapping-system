#!/bin/bash
echo "Starting TUK Mapping System..."
echo "Note: It may take a moment to load from the CD."

# Get the directory where the script is located
DIR="$(dirname "$0")"

# Ensure the AppImage is executable
chmod +x "$DIR/TUK-Mapping-System.AppImage"

# Run the AppImage in the background
"$DIR/TUK-Mapping-System.AppImage" &

exit 0
