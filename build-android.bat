@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0"
set "ANDROID_DIR=%ROOT_DIR%android"
set "ANDROID_SDK_ROOT=C:\Android"
set "GRADLE_USER_HOME=C:\Android\gradle-cache"

REM Set environment variables
set ANDROID_HOME=%ANDROID_SDK_ROOT%

echo Building APK...
cd /d "%ANDROID_DIR%"

if not exist "gradlew.bat" (
    echo Error: gradlew.bat not found
    exit /b 1
)

echo Running: gradlew.bat assembleDebug
call gradlew.bat assembleDebug
if %ERRORLEVEL% neq 0 (
    echo Build failed!
    exit /b 1
)

echo.
echo Build complete!
echo APK location: %ROOT_DIR%android\app\build\outputs\apk\debug\app-debug.apk

REM Try to install
set "APK_PATH=%ROOT_DIR%android\app\build\outputs\apk\debug\app-debug.apk"
set "ADB_PATH=%ANDROID_SDK_ROOT%\platform-tools\adb.exe"

if exist "%APK_PATH%" (
    echo.
    echo Installing on device...
    "%ADB_PATH%" install -r "%APK_PATH%"
    if %ERRORLEVEL% equ 0 (
        echo Done!
    )
)
