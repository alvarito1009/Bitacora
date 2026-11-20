# Bitácora · Planta KPI

Dashboard web preliminar para consultar producción, tiempos muertos, calidad, hornos y cortes de una planta de vidrio.

## Estado actual

Esta primera versión es una maqueta navegable en HTML, CSS y JavaScript. Incluye datos de demostración basados en la estructura del reporte diario del 19-Nov-2026; todavía no conecta Excel, base de datos ni autenticación.

La portada incluye KPIs, filtros, semáforos, tabla comparativa, hallazgos y gráficos interactivos. También incluye vistas de detalle por máquina, calidad, hornos y cortes.

## Archivos principales

- `index.html`: estructura de la aplicación.
- `styles.css`: sistema visual responsive.
- `app.js`: datos demo, navegación, filtros y gráficos Chart.js.
- `TODO.md`: siguientes resultados de producto.
- `manus-routes.json`: rutas de la aplicación.

## Datos productivos

No subir a este repositorio reportes diarios, bitácoras bimestrales, Excel, CSV, nombres de clientes, pedidos, operadores ni archivos exportados de producción. El `.gitignore` bloquea las extensiones y carpetas más comunes. En la siguiente etapa los datos se conservarán en una base de datos y los archivos originales en almacenamiento privado.

## Desarrollo local

La maqueta no requiere instalación de dependencias: puede servirse con un servidor HTTP estático desde la raíz del proyecto.

```bash
python3 -m http.server 3000 --bind 127.0.0.1
```

Chart.js se carga desde CDN en `index.html` para la demo visual.
