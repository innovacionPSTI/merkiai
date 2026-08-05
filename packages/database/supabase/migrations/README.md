# Migraciones — guía compacta

Para desplegar la base de datos **solo necesitas 2 rutas**. No ejecutes los archivos numerados uno por uno.

## Despliegue NUEVO (desde cero)

Ejecuta en el SQL Editor de Supabase, en orden:

1. `01_schema.sql` — **esquema canónico completo** (todas las tablas, columnas, constraints, índices, triggers y funciones RPC). Es la única fuente de verdad del esquema.
2. `../seeds/01_config.sql` — tema por defecto, tipos de variante, categorías, nav base.
3. `../seeds/02_content.sql` — páginas, secciones e ítems del CMS.

## BD EXISTENTE (actualizar una instalación previa)

Ejecuta **solo**:

- `upgrade.sql` — parche idempotente consolidado que lleva una BD del baseline v13 hasta v16 (favicon, `admin_config`, `email_provider` + Tu Compra, `active_provider` + Bold, e inventario). Es seguro re-ejecutarlo.

## Archivos históricos (`1_*` … `25_*`)

Se conservan **solo como registro** de la evolución del esquema. **No forman parte del flujo de despliegue** y no deben ejecutarse en instalaciones nuevas — su contenido ya está incorporado en `01_schema.sql` (y consolidado en `upgrade.sql` para actualizaciones).

| Rango | Contenido | Estado |
|-------|-----------|--------|
| `1_*` … `20_*` | Esquema base + CMS unificado + integridad (baseline v13) | Fusionado en `01_schema.sql` |
| `21_*` … `25_*` | Favicon, admin_config, proveedores, pasarela única + Bold, inventario | Fusionado en `01_schema.sql` y `upgrade.sql` |
