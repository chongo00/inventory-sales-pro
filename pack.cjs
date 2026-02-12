#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const RELEASE_DIR = path.join(ROOT, 'release', 'Inventory & Sales Pro');
const ELECTRON_DIR = path.join(ROOT, 'node_modules', 'electron', 'dist');

console.log('📦 Creando aplicación portable...');

// Limpiar carpetas previas
if (fs.existsSync(path.join(ROOT, 'release'))) {
  fs.rmSync(path.join(ROOT, 'release'), { recursive: true });
}

// Crear estructura de carpetas
fs.mkdirSync(RELEASE_DIR, { recursive: true });

// Copiar binarios de Electron
console.log('📋 Copiando archivos de Electron...');
const electronExe = path.join(ELECTRON_DIR, 'electron.exe');
const electronAsar = path.join(ELECTRON_DIR, 'resources', 'app');

// Copiar todas las DLLs y archivos necesarios
const filesToCopy = fs.readdirSync(ELECTRON_DIR);
filesToCopy.forEach(file => {
  const src = path.join(ELECTRON_DIR, file);
  const dst = path.join(RELEASE_DIR, file);
  
  if (fs.statSync(src).isDirectory()) {
    if (file !== 'resources') {
      fs.cpSync(src, dst, { recursive: true });
    }
  } else {
    fs.copyFileSync(src, dst);
  }
});

// Crear estructura app
const appDir = path.join(RELEASE_DIR, 'resources', 'app');
fs.mkdirSync(appDir, { recursive: true });

// Copiar dist, electron y package.json
console.log('📂 Copiando aplicación compilada...');
fs.cpSync(path.join(ROOT, 'dist'), path.join(appDir, 'dist'), { recursive: true });
fs.cpSync(path.join(ROOT, 'electron'), path.join(appDir, 'electron'), { recursive: true });

const pkgData = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify({
  name: pkgData.name,
  main: pkgData.main,
  version: pkgData.version
}, null, 2));

// Renombrar la copia de electron.exe a "Inventory & Sales Pro.exe"
const copiedExe = path.join(RELEASE_DIR, 'electron.exe');
const appExe = path.join(RELEASE_DIR, 'Inventory & Sales Pro.exe');
if (fs.existsSync(copiedExe)) {
  fs.renameSync(copiedExe, appExe);
} else {
  console.log('⚠️ electron.exe no encontrado en release, copiando directamente...');
  fs.copyFileSync(electronExe, appExe);
}

console.log('✅ ¡Listo!');
console.log('');
console.log('📍 Ubicación: ' + path.join(ROOT, 'release'));
console.log('🚀 Ejecutable: ' + appExe);
console.log('');
console.log('Para distribuir: copia toda la carpeta "release/Inventory & Sales Pro/"');
