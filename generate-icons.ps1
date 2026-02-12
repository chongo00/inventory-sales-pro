# Script para generar iconos de Android desde listas-de-control.png

Write-Host "================================================================================`n" -ForegroundColor Cyan
Write-Host "  Generando iconos de Android desde listas-de-control.png`n" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

$sourceImage = ".\listas-de-control.png"
$androidResPath = ".\android\app\src\main\res"

# Verificar que existe la imagen fuente
if (-not (Test-Path $sourceImage)) {
    Write-Host "`n[ERROR] No se encuentra la imagen: $sourceImage" -ForegroundColor Red
    exit 1
}

# Definir los tamaños de iconos
$iconSizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

Write-Host "`n[1/3] Cargando imagen fuente..." -ForegroundColor Yellow
Add-Type -AssemblyName System.Drawing
$srcImage = [System.Drawing.Image]::FromFile((Resolve-Path $sourceImage))

Write-Host "[2/3] Generando iconos en diferentes resoluciones...`n" -ForegroundColor Yellow

foreach ($folder in $iconSizes.Keys) {
    $size = $iconSizes[$folder]
    $targetFolder = Join-Path $androidResPath $folder
    $targetFile = Join-Path $targetFolder "ic_launcher.png"
    $targetFileRound = Join-Path $targetFolder "ic_launcher_round.png"
    
    Write-Host "  - $folder ($size x $size px)..." -NoNewline
    
    # Crear carpeta si no existe
    if (-not (Test-Path $targetFolder)) {
        New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
    }
    
    # Redimensionar imagen
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($srcImage, 0, 0, $size, $size)
    
    # Guardar imagen cuadrada
    $bitmap.Save($targetFile, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Guardar imagen redonda (mismo archivo por ahora, Android usa clip)
    $bitmap.Save($targetFileRound, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Host " OK" -ForegroundColor Green
}

$srcImage.Dispose()

Write-Host "`n[3/3] Iconos generados exitosamente!`n" -ForegroundColor Green
Write-Host "Archivos creados en: $androidResPath\mipmap-*\ic_launcher.png" -ForegroundColor Cyan
Write-Host "Archivos creados en: $androidResPath\mipmap-*\ic_launcher_round.png" -ForegroundColor Cyan
Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "  Ejecuta .\build-android.ps1 para compilar con los nuevos iconos" -ForegroundColor Cyan
Write-Host "================================================================================`n" -ForegroundColor Cyan
