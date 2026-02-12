$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================================================"
Write-Host "       INVENTORY SALES PRO - Build y actualizar en Android (Simple)"
Write-Host "================================================================================"
Write-Host ""

$root = (Get-Location).Path

# [1/4] Compilar web con Vite
Write-Host "[1/4] Compilando web (npm run build)..." -ForegroundColor Yellow

& node ./node_modules/vite/bin/vite.js build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR compilando web. Abortando." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "      OK." -ForegroundColor Green

# [2/4] Copiar dist a Assets (sin Capacitor sync)
Write-Host ""
Write-Host "[2/4] Copiando dist -> android/app/src/main/assets/public..." -ForegroundColor Yellow

$assetsDir = "$root\android\app\src\main\assets\public"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
}

# Limpiar y copiar
Remove-Item "$assetsDir\*" -Recurse -Force 2>$null
Copy-Item -Path "$root\dist\*" -Destination $assetsDir -Recurse -Force

Write-Host "      OK." -ForegroundColor Green

# [3/4] Compilar APK con Gradle
Write-Host ""
Write-Host "[3/4] Compilando APK con Gradle..." -ForegroundColor Yellow

$env:GRADLE_USER_HOME = "C:\Android\gradle-cache"
$env:GRADLE_OPTS = "-Dorg.gradle.internal.http.connectionTimeout=1800000 -Dorg.gradle.internal.http.socketTimeout=1800000"

Push-Location "$root\android"

Write-Host "      Esto puede tardar varios minutos..."

& .\gradlew.bat assembleDebug --no-daemon

$gradleExit = $LASTEXITCODE
Pop-Location

if ($gradleExit -ne 0) {
    Write-Host "ERROR compilando APK." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "      APK compilado correctamente." -ForegroundColor Green

# [4/4] Instalar en teléfono
Write-Host ""
Write-Host "[4/4] Instalando en teléfono..." -ForegroundColor Yellow

# Buscar adb
$adb = $null
foreach ($p in @("C:\Android\platform-tools\adb.exe", "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe", "$env:ANDROID_HOME\platform-tools\adb.exe")) {
    if ($p -and (Test-Path $p)) { 
        $adb = $p
        break 
    }
}
if (-not $adb) { $adb = "adb" }

Write-Host ""
Write-Host "      Dispositivos conectados:"
& $adb devices
Write-Host ""

$apk = "$root\android\app\build\outputs\apk\debug\app-debug.apk"

if (-not (Test-Path $apk)) {
    Write-Host "ERROR: APK no encontrado: $apk" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "      Instalando APK..." -ForegroundColor Yellow

$result = & $adb install -r $apk 2>&1

if ($LASTEXITCODE -ne 0 -and ($result -match "INSTALL_FAILED_UPDATE_INCOMPATIBLE|signatures do not match")) {
    Write-Host "      Desinstalando version anterior..." -ForegroundColor Yellow
    & $adb uninstall com.inventorysalespro.app 2>$null
    Write-Host "      Instalando nueva version..."
    & $adb install -r $apk
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "      OK - App instalada." -ForegroundColor Green
    
    Write-Host "      Iniciando app..."
    & $adb shell am start -n com.inventorysalespro.app/.MainActivity 2>$null
    
    Write-Host ""
    Write-Host "================================================================================"
    Write-Host "                        LISTO!"
    Write-Host "================================================================================"
    Write-Host "La app está instalada y ejecutándose en tu teléfono." -ForegroundColor Green
} else {
    Write-Host "ERROR instalando. Revisa USB y Depuracion USB: $adb" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Read-Host "Presiona Enter para salir"
