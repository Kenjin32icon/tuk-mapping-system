@echo off
echo Starting TUK Mapping System...
echo Note: It may take a moment to load from the CD.

:: CD to the directory containing this batch file (so it works from any drive letter)
cd /d "%~dp0"

:: Launch the portable executable in the background
start "" "TUK-Mapping-System.exe"

exit
