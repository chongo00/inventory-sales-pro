# Sistema de diseño – SalesPro

## Dirección

- **Dominio:** Inventario y ventas (POS, reportes, stock). Usuario: dueño o empleado en punto de venta.
- **Sensación:** Clara, rápida de usar, fiable. Prioridad a lectura de números y acciones frecuentes (vender, filtrar, exportar).
- **Paleta:** Slate para estructura y texto, indigo como acento principal, emerald/blue/rose para estados (efectivo, transferencia, fiao/deuda).

## Profundidad

- **Estrategia:** Bordes suaves (border-slate-100/200) + sombras ligeras (shadow-sm) en cards y controles.
- **Superficies:** Fondo canvas `bg-slate-50`; cards `bg-white` con `border border-slate-100` y `shadow-sm`.

## Espaciado

- **Base:** 4px. Escala: gap-2 (8px), gap-3 (12px), gap-4 (16px), gap-6 (24px), gap-8 (32px).
- **Padding:** Cards p-4 en móvil, p-6 en md+; secciones space-y-6 / space-y-8.

## Tipografía

- **Fuente:** Inter (ya cargada en index.css).
- **Jerarquía:** Títulos vista text-xl md:text-2xl font-bold; subtítulos text-slate-500 text-sm; labels uppercase tracking-widest text-xs font-black text-slate-400; datos font-black o font-bold.

## Controles

- **Botones primarios:** bg-indigo-600 hover:bg-indigo-700, rounded-2xl, py-3 px-6, font-bold.
- **Botones secundarios/icono:** p-2 rounded-xl, hover:bg-{color}-50.
- **Inputs:** bg-slate-50 o bg-white border border-slate-200, rounded-xl, focus:ring-2 focus:ring-indigo-500.

## Responsividad

- **Breakpoints:** sm 640px, md 768px, lg 1024px. Sidebar fija en md+; en móvil menú deslizable.
- **Tap targets:** Mínimo ~44px en acciones táctiles (botones de venta, filtros, acciones de tabla).
- **Tablas:** En móvil reemplazar por cards/lista cuando sea necesario (ej. Reportes ya usa vista móvil por fila).

## Patrones reutilizables

- **StatCard:** bg-white, rounded-2xl, border shadow-sm, icono en contenedor bg-slate-50, valor font-bold text-slate-800.
- **Filtros temporales:** Tabs o select con opciones (Hoy, Ayer, Mes…) en bg-white rounded-2xl p-1.
- **Toasts:** fixed bottom/right, rounded-2xl shadow-lg, z-50, animación slideUp.
