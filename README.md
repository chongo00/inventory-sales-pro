# Inventory & Sales Pro

Sistema integral de gestión de inventario y ventas con análisis de ganancias en tiempo real.

## 🎯 Características

- **Dashboard**: Resumen en tiempo real de stock, ventas y ganancias
- **Inventario**: CRUD completo de productos con categorías y múltiples monedas (CUP/USD)
- **POS (Punto de Venta)**: Registro rápido de ventas con múltiples métodos de pago
- **Reportes**: Análisis de ventas, gráficos y seguimiento de deudas (Fiao)
- **PDF Export**: Generación de facturas y reportes descargables
- **Totalmente Offline**: Funciona sin internet, datos guardados localmente
- **Multiplataforma**: Web, Desktop (Electron) y Móvil (Android)

## 🔧 Requisitos

- Node.js 18+
- Para Android: Android SDK (configurado en `C:\Android`)

## 🚀 Instalación y uso

### 1. Instalar dependencias
```bash
npm install
```

### 2. Modo Web (Desarrollo)
```bash
npm run dev
# Abre http://localhost:3000
```

### 3. Modo Desktop (Electron)
```bash
npm run start:desktop
# O con hot-reload:
npm run dev:desktop
```

### 4. Compilar para producción
```bash
npm run pack
# Crea ejecutable standalone en: release/Inventory & Sales Pro/
```

### 5. Compilar para Android
```bash
npm run build:android
# Instala en tu teléfono conectado
```

## 📱 Datos persistentes
Todos los datos se guardan en **localStorage** (navegador) o en almacenamiento compartido (Android).
No necesita servidor ni conexión a internet.

## 📊 Uso de la aplicación

### Dashboard
- Vista rápida de métricas: stock total, vendidos, ganancias, pendientes
- Gráficos de proporción de inventario y categorías

### Inventario
- Agregar/editar/eliminar productos
- Filtrar por categoría o nombre
- Múltiples monedas y unidades (UND/LB)

### Ventas (POS)
- Seleccionar producto y cantidad
- Métodos de pago: Efectivo, Transferencia, Fiao (crédito)
- Información del cliente para deudas

### Reportes
- Resumen de ventas por período
- Exportar a PDF
- Cobrar deudas (Fiao)

## 📦 Distribución

### Desktop (Windows)
Copia la carpeta `release/Inventory & Sales Pro/` a cualquier PC sin instalar nada.

### Android
1. Conecta tu teléfono vía USB
2. Ejecuta: `npm run build:android`
3. La app se instalará automáticamente
