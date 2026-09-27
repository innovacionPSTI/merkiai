# ADR-002 · Presets de nicho, Onboarding y Entitlements (puesta a punto por plan)

> **Estado:** Aceptado (sep-2026). **Contexto:** E13/E17. **Deriva de:** HU-169 (onboarding), HU-207 (seed), HU-218/220 (templates/constructor), HU-173/200 (planes/entitlements), E18 (multi-ubicación).
> **Propósito:** dejar constancia del objetivo y del vocabulario para que todo lo que se construya esté fundamentado y **no genere reprocesos ni acoplamientos** difíciles de deshacer.

## 1. Objetivo

Que una tienda pase de "recién creada" a "operativa y con estilo" en **minutos**, eligiendo un **Preset de nicho** y ajustando lo que quiera, **siempre dentro de lo que su Plan permite**. La plataforma cura los presets y define los límites; el comerciante aplica y personaliza; el plan es el techo.

## 2. Taxonomía de conceptos (vocabulario canónico)

Cada palabra se reserva a **una sola** cosa. Prohibido reusar "template" para paletas o presets.

| Concepto | Qué es | Dónde vive |
|---|---|---|
| **Tema (Paleta)** | Tokens visuales: colores, tipografía, radios. Una paleta curada = un Tema. | `themes` (BD de tienda) |
| **Template** | **Estructura/disposición**: qué bloques y en qué orden por página. | **Código** (`blockSchemas` + layouts, HU-218/220); `store_config.template` selecciona uno |
| **Preset (de nicho)** | **Bundle curado** = un Tema + un Template + secciones/contenido de arranque + categorías/productos de ejemplo + modelo de inventario sugerido. | **BD de plataforma** (`presets`), CRUD desde la consola |
| **Constructor** | Editor visual de páginas del admin (compone bloques). | admin |
| **Onboarding** | Asistente de puesta a punto (primer arranque) del admin. | admin |
| **Nicho** | Vertical/categoría de negocio (café, moda, servicios…) que agrupa presets. | atributo del Preset |
| **Plan / Entitlements** | `features` (booleans) + `limits` (números) que definen el techo del tenant. | `plans` (BD de plataforma) |

**Regla mnemotécnica:** *Template = estructura (código)* · *Tema = paleta* · *Preset = contenido curado (BD plataforma)*.

## 3. Propiedad de los datos (evita acoplamientos)

- **Estructura** (blockSchemas, layouts, validación) → **código**, versionada con la app.
- **Contenido-preset** (bundles por nicho, textos, ejemplos) → **BD de plataforma**, editable por el operador **sin deploy** (CRUD en consola).
- **Datos del tenant** (config, secciones, catálogo, pedidos) → **BD de tienda**, acotados por RLS.
- **Aplicar un preset** = **copiar** el preset (plataforma) al store DB del tenant. Nunca se referencia el preset en vivo desde la tienda; se materializa y luego el comerciante lo edita libremente.

## 4. Reparto de responsabilidades

- **Consola (plataforma):** CRUD de **Presets** y **Planes** (features/limits); asigna plan + nicho al aprovisionar; **sirve los entitlements** (endpoint interno, ya existe); aprueba dominios propios. Único origen de "qué existe" y "qué permite cada plan".
- **Admin (comerciante):** corre el **Onboarding**, que **aplica el preset** y guía la personalización **dentro de los entitlements**; todo queda editable después (config real + Constructor).
- **Tienda:** solo **renderiza** el resultado.

## 5. Modelo de Entitlements (cómo se "limita todo")

Infraestructura existente (HU-173): `plans.features` (jsonb bool/string/number), `plans.limits` (jsonb number), `PlanEntitlements`, `hasFeature`/`withinLimit`, `getTenantEntitlements`.

- **Features (boolean):** `custom_domain`, `multi_location`, `ai_design`, `page_builder`, `constructor`, …
- **Limits (número):** `products`, `users`, `categories`, `locations`, `orders_month`, `ai_generations_month`, …
- **Nichos por plan:** NO se codifican en `plans.features` (una lista no encaja). Cada **Preset declara `available_in_plans`**; el wizard solo muestra los presets disponibles para el plan del tenant. Más flexible y CRUD-friendly.
- **Catálogo canónico:** existe un **registro único** de todas las claves de `features`/`limits` (nombre, tipo, descripción) — fuente para el editor de planes de la consola y para el gating; **prohibido** usar strings sueltos dispersos.

**Enforcement en dos capas:**
1. **Servidor = fuente de verdad.** Toda creación/acción (producto, categoría, sucursal, aplicar preset, generar diseño IA, dominio) valida `feature`/`limit` en la API **aunque la UI lo oculte**. No se puede saltar el plan llamando la API directo.
2. **UI = pista.** Wizard y admin **ocultan/deshabilitan** lo no permitido y ofrecen "mejora tu plan".

El **Onboarding lee los entitlements** y arma sus pasos: solo contempla lo habilitado por el plan (sin `multi_location` → sin sucursales; sin `custom_domain` → "solicitar dominio/upgrade"; solo presets `available_in_plans`; respeta límites al crear).

## 6. Decisiones

1. **Nombre del bundle = "Preset"** (tabla `presets`), nunca "template".
2. **Nichos limitados por plan** vía `available_in_plans` en el preset (no en `plans.features`).
3. **"Aplicar preset" = una** función idempotente reutilizada por consola (al aprovisionar) y admin (wizard / re-aplicar). Única fuente de verdad de la puesta a punto.
4. **Enforcement server-side siempre**; la UI solo sugiere.
5. **Sucursales**: el onboarding solo **elige el modelo** (`store_config.inventory_model`); la creación real de ubicaciones va con **E18**.
6. **Orden de implementación:** entitlements canónicos (transversal) → CRUD de presets → seed + aplicar → wizard → modelo de inventario → sucursales (con E18). Empezar por entitlements evita retrabajo.

## 7. Consecuencias

- Un vocabulario único elimina la ambigüedad de "template" en código, docs y UI.
- Separar estructura/contenido/datos permite curar presets sin deploy y sin tocar la app.
- El gating centralizado evita reglas de plan dispersas y hace trivial agregar features/limits nuevos.
- El onboarding como capa guiada (no lógica paralela) mantiene todo editable después, sin duplicar reglas.

Ver HU-233…239 (`docs/backlog/08-…`).
