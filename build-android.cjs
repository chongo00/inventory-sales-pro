#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

console.log('\n📱 Construyendo aplicación Android...\n');

// Configurar variables de entorno del SDK
const androidSdkRoot = 'C:\\Android';
const gradleCache = 'C:\\Android\\gradle-cache';

process.env.ANDROID_SDK_ROOT = androidSdkRoot;
process.env.ANDROID_HOME = androidSdkRoot;
process.env.GRADLE_USER_HOME = gradleCache;

console.log('✓ Variables de entorno configuradas');
console.log(`  ANDROID_SDK_ROOT: ${androidSdkRoot}`);
console.log(`  GRADLE_USER_HOME: ${gradleCache}\n`);

// Paso 1: Compilar React/Vite
console.log('1️⃣ Compilando aplicación web...');
try {
  execSync('node ./node_modules/vite/bin/vite.js build', { 
    cwd: ROOT, 
    stdio: 'inherit',
    shell: 'cmd.exe'
  });
  console.log('✓ Compilación web completada\n');
} catch (e) {
  console.error('❌ Error compilando:', e.message);
  process.exit(1);
}

// Paso 2: Inicializar Capacitor Android
console.log('2️⃣ Configurando Capacitor para Android...');
try {
  const androidPath = path.join(ROOT, 'android');
  if (!fs.existsSync(androidPath)) {
    console.log('   Agregando plataforma Android...');
    execSync('npx capacitor add android', { 
      cwd: ROOT,
      stdio: 'inherit',
      shell: 'cmd.exe'
    });
  } else {
    console.log('   Plataforma Android ya existe, actualizando...');
    execSync('npx capacitor sync android', {
      cwd: ROOT,
      stdio: 'inherit',
      shell: 'cmd.exe'
    });
  }
  console.log('✓ Capacitor configurado\n');
} catch (e) {
  console.warn('⚠️  Error configurando Capacitor, continuando...');
  console.warn(`  ${e.message}\n`);
}

// Paso 3: Verificar dispositivo Android
console.log('3️⃣ Buscando dispositivo Android...');
try {
  const adbPath = path.join(androidSdkRoot, 'platform-tools', 'adb.exe');
  const devices = execSync(`"${adbPath}" devices`, { encoding: 'utf8', shell: 'cmd.exe' });
  
  const lines = devices.split('\n').filter(l => l.trim() && !l.includes('List'));
  const connectedDevices = lines.filter(l => (l.includes('device') || l.includes('unauthorized')) && !l.includes('offline'));
  
  if (connectedDevices.length === 0) {
    console.warn('⚠️  No hay dispositivo conectado');
    console.warn('   Asegúrate de conectar tu teléfono por USB y habilitar depuración USB\n');
  } else {
    console.log('✓ Dispositivo encontrado:');
    connectedDevices.forEach(d => {
      const status = d.includes('unauthorized') ? '🔒 (necesita autorización)' : '✓';
      console.log(`  ${status} ${d.split(/\s+/)[0]}`);
    });
    if (connectedDevices.some(d => d.includes('unauthorized'))) {
      console.warn('\n⚠️  El dispositivo necesita autorización');
      console.warn('   Aceptar la solicitud en la pantalla del teléfono\n');
    }
    console.log();
  }
} catch (e) {
  console.warn('⚠️  Error buscando dispositivo:', e.message, '\n');
}

// Paso 4: Compilar con Gradle
console.log('4️⃣ Compilando APK con Gradle...');
try {
  const androidDir = path.join(ROOT, 'android');
  const gradleWrapper = path.join(androidDir, 'gradlew.bat');
  
  if(!fs.existsSync(gradleWrapper)) {
    console.warn('⚠️  Carpeta Android no existe aún. Asegúrate de instalar Capacitor primero.');
    console.warn('   Ejecuta: npm run build:android nuevamente\n');
    process.exit(0);
  }
  
  process.chdir(androidDir);
  execSync(`"${gradleWrapper}" assembleDebug`, { 
    stdio: 'inherit',
    shell: 'cmd.exe',
    env: {
      ...process.env,
      ANDROID_SDK_ROOT: androidSdkRoot,
      ANDROID_HOME: androidSdkRoot,
      GRADLE_USER_HOME: gradleCache
    }
  });
  
  console.log('\n✓ APK compilado\n');
  
  // Paso 5: Instalar en dispositivo
  console.log('5️⃣ Instalando en dispositivo Android...');
  const adbPath = path.join(androidSdkRoot, 'platform-tools', 'adb.exe');
  const apkPath = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  
  if (fs.existsSync(apkPath)) {
    try {
      execSync(`"${adbPath}" install -r "${apkPath}"`, { 
        stdio: 'inherit',
        shell: 'cmd.exe'
      });
      console.log('\n✓ Aplicación instalada en el dispositivo\n');
    } catch (installError) {
      console.warn('⚠️  No se pudo instalar automáticamente en el dispositivo');
      console.log('\n   Para instalar manualmente:\n');
      console.log(`   "${adbPath}" install -r "${apkPath}"\n`);
    }
  } else {
    console.log('   APK compilado en:', apkPath);
  }
} catch (e) {
  console.error('❌ Error compilando APK:', e.message);
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ Compilación completada');
console.log('═══════════════════════════════════════════════════════════\n');
console.log('📱 Si el APK no se instaló automáticamente:');
console.log('   1. Aceptar autorización en el teléfono (si aparece)');
console.log('   2. Ejecutar: npm run build:android');
console.log('   3. O instalar manualmente usando adb\n');
