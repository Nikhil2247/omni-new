@echo off
REM ============================================================================
REM MONGODB BACKUP EXTRACTION SCRIPT
REM ============================================================================
REM This script extracts the MongoDB backup and converts BSON to JSON
REM Prerequisites: MongoDB Database Tools (mongorestore, bsondump)
REM Download from: https://www.mongodb.com/try/download/database-tools
REM ============================================================================

set BACKUP_FILE=D:\backup\backup-20-02-2026.gz
set EXTRACTED_DIR=D:\backup\extracted
set JSON_DIR=D:\backup\extracted\json

echo ============================================
echo MongoDB Backup Extraction Tool
echo ============================================

REM Create directories
if not exist "%EXTRACTED_DIR%" mkdir "%EXTRACTED_DIR%"
if not exist "%JSON_DIR%" mkdir "%JSON_DIR%"

REM Check if backup exists
if not exist "%BACKUP_FILE%" (
    echo ERROR: Backup file not found: %BACKUP_FILE%
    exit /b 1
)

echo.
echo Step 1: Extracting .gz file...
echo.

REM Extract using tar (Windows 10+ has tar built-in)
tar -xzf "%BACKUP_FILE%" -C "%EXTRACTED_DIR%"

if errorlevel 1 (
    echo ERROR: Failed to extract backup. Please install 7zip or use WSL.
    echo Alternative: Use 7zip to extract manually
    exit /b 1
)

echo Backup extracted to: %EXTRACTED_DIR%
echo.

REM Find the dump directory
set DUMP_DIR=%EXTRACTED_DIR%\dump\omnicassion
if not exist "%DUMP_DIR%" (
    set DUMP_DIR=%EXTRACTED_DIR%\omnicassion
)
if not exist "%DUMP_DIR%" (
    echo Looking for BSON files...
    dir /s /b "%EXTRACTED_DIR%\*.bson" 2>nul
)

echo.
echo Step 2: Converting BSON to JSON...
echo.

REM Convert each BSON file to JSON using bsondump
for %%f in ("%DUMP_DIR%\*.bson") do (
    echo Converting: %%~nf.bson
    bsondump --outFile="%JSON_DIR%\%%~nf.json" "%%f"
)

echo.
echo ============================================
echo Extraction Complete!
echo ============================================
echo JSON files are in: %JSON_DIR%
echo.
echo Collections found:
dir /b "%JSON_DIR%\*.json" 2>nul
echo.
echo Now run the migration script:
echo   cd D:\omnicassion\omni-new\backend
echo   npx ts-node scripts\migrate-mongodb-to-postgres.ts
echo ============================================

pause
