# Merkiai — Guía de Despliegue en Vercel + GitHub

> **Stack:** Next.js 16 · Turborepo · pnpm · Supabase  
> **Repositorio:** monorepo con dos apps (`apps/web` y `apps/admin`)  
> **Desarrollado por:** [Parquesoft TI](mailto:produccion@parquesoftti.com)

---

## Tabla de contenido

1. [Resumen de la arquitectura de despliegue](#1-resumen-de-la-arquitectura-de-despliegue)
2. [Requisitos previos](#2-requisitos-previos)
3. [Preparar el repositorio en GitHub](#3-preparar-el-repositorio-en-github)
4. [Migraciones en Supabase (producción)](#4-migraciones-en-supabase-producción)
5. [Crear proyecto Vercel — Sitio público (apps/web)](#5-crear-proyecto-vercel--sitio-público-appsweb)
6. [Crear proyecto Vercel — Panel admin (apps/admin)](#6-crear-proyecto-vercel--panel-admin-appsadmin)
7. [Variables de entorno](#7-variables-de-entorno)
8. [Configuración de dominios y DNS](#8-configuración-de-dominios-y-dns)
9. [Webhooks de Skydropx](#9-webhooks-de-skydropx)
10. [Pipeline CI/CD automático](#10-pipeline-cicd-automático)
11. [Fuentes tipográficas en producción](#11-fuentes-tipográficas-en-producción)
12. [Configuración post-deploy](#12-configuración-post-deploy)
13. [Checklist pre-deploy](#13-checklist-pre-deploy)
14. [Rollback y gestión de incidencias](#14-rollback-y-gestión-de-incidencias)
15. [Variables de entorno — referencia completa](#15-variables-de-entorno--referencia-completa)
16. [Despliegue multi-tenant + SaaS (roadmap E17)](#16-despliegue-multi-tenant--saas-roadmap-e17)

---

## 1. Resumen de la arquitectura de despliegue

Este monorepo se despliega como **dos proyectos independientes en Vercel**, cada uno mapeado a su propia app dentro del repositorio.

```
GitHub (monorepo merkiai)
         │
         ├── push a main
         │
         ├──▶ Vercel Project: merkiai-web   (apps/web)
         │         └── tienda.example.com
         │
         └──▶ Vercel Project: merkiai-admin  (apps/admin)
                   └── admin.tienda.example.com
```

| Proyecto Vercel | App en el repo | Dominio | Puerto local |
|----------------|----------------|---------|-------------|
| `merkiai-web` | `apps/web` | `tienda.example.com` | 3000 |
| `merkiai-admin` | `apps/admin` | `admin.tienda.example.com` | 3001 |

Vercel detecta automáticamente que es un monorepo y maneja la caché de Turborepo entre builds.

> **Modelo actual = single-tenant** (una instalación = una tienda). Para el modelo **multi-tenant/SaaS** (E17) —tercer app `apps/console`, **BD de plataforma en proyecto Supabase propio**, subdominios wildcard y dominios personalizados por tenant— ver la **[sección 16](#16-despliegue-multi-tenant--saas-roadmap-e17)**.

---

## 2. Requisitos previos

Antes de comenzar, tener listos:

- [ ] Cuenta en [Vercel](https://vercel.com) (plan Hobby o Pro)
- [ ] Repositorio creado en GitHub con el código del monorepo
- [ ] Proyecto en [Supabase](https://supabase.com) de **producción** (distinto al de desarrollo)
- [ ] Dominio registrado (ej. `tienda.example.com`) con acceso al panel DNS
- [ ] Fuentes tipográficas: `typogama-ahsing.otf` y `Geeeki-Regular.otf`

> **Importante:** Usar proyectos Supabase separados para desarrollo y producción. Nunca apuntar producción a la misma BD de desarrollo.

---

## 3. Preparar el repositorio en GitHub

### 3.1 Crear el repositorio

```bash
# En la raíz del monorepo
git init
git add .
git commit -m "chore: initial commit"

# En GitHub: crear repositorio privado "merkiai"
git remote add origin https://github.com/<org>/merkiai.git
git branch -M main
git push -u origin main
```

### 3.2 Estructura de ramas recomendada

| Rama | Propósito | Deployment automático |
|------|-----------|----------------------|
| `main` | Producción | ✅ sí → `tienda.example.com` |
| `staging` | Pre-producción / QA | ✅ sí → Preview URL de Vercel |
| `feat/*` | Desarrollo de features | ✅ sí → Preview URL por PR |

### 3.3 Archivos a ignorar en Git

Verificar que `.gitignore` en la raíz incluya:

```gitignore
# Entornos locales — NUNCA subir al repositorio
.env.local
.env.*.local
apps/web/.env.local
apps/admin/.env.local

# Build outputs
.next/
out/
dist/

# Turborepo cache
.turbo/

# Node modules
node_modules/
```

### 3.4 Copiar fuentes al repositorio

Las fuentes **deben estar en el repositorio** para que Vercel pueda servirlas en el build:

```bash
# Copiar ambas fuentes en cada app
cp typogama-ahsing.otf   apps/web/public/fonts/
cp Geeeki-Regular.otf    apps/web/public/fonts/
cp typogama-ahsing.otf   apps/admin/public/fonts/
cp Geeeki-Regular.otf    apps/admin/public/fonts/

git add apps/web/public/fonts/ apps/admin/public/fonts/
git commit -m "chore: add custom fonts for production build"
git push
```

> Si las fuentes tienen licencia que impide subirlas a un repo público, usar un repositorio **privado** en GitHub.

---

## 4. Migraciones en Supabase (producción)

Antes de desplegar, el schema de producción debe estar al día. **Solo existen 2 archivos de migración** (`01_schema.sql` y `upgrade.sql`). Ver también `packages/database/supabase/migrations/README.md`.

> **Consejo:** Copia el contenido del archivo `.sql` y pégalo en el SQL Editor de Supabase → **Run**.

**Despliegue NUEVO (BD desde cero):**

| # | Archivo | Qué hace |
|---|---------|----------|
| 1 | `migrations/01_schema.sql` | **Esquema canónico completo**: todas las tablas (incl. `payment_config`, `orders`, `processed_webhook_events`), columnas, constraints, índices, triggers y RPC |
| 2 | `seeds/01_config.sql` | Tema por defecto, tipos de variante, categorías, navegación base |
| 3 | `seeds/02_content.sql` | Páginas, secciones e ítems del CMS |

**BD EXISTENTE (actualizar una instalación previa):**

| # | Archivo | Qué hace |
|---|---------|----------|
| 1 | `migrations/upgrade.sql` | Parche **idempotente** consolidado hasta la migración 29 (favicon, admin_config, proveedores, `active_provider`+Bold, inventario, número de orden, **Tu Compra REST/integrador** — seguimiento + llave de firma —, **endurecimiento de webhooks** — `processed_webhook_events` + `mercadopago_webhook_secret`). Seguro re-ejecutarlo. |

### Verificar el schema

Después de aplicar, verificar en **Table Editor** que existen (entre otras):

- `profiles`, `categories`, `products`, `product_variants`
- `orders` (con `tucompra_codigo_seguimiento`, `tucompra_numero_transaccion`)
- `banners`, `blog_posts`, `newsletter_subscribers`
- `shipping_config`, `store_config`, `payment_config` (una fila id=1 cada una)
- `payment_config` con `active_provider`, `tucompra_*`, `bold_*`, `mercadopago_webhook_secret`
- `processed_webhook_events` (idempotencia de webhooks)
- `shipping_profiles`, `customers`, `customer_addresses`

Verificar que RLS esté activo en todas las tablas:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Todas deben mostrar `rowsecurity = true`.

Y en **Storage** que existen los buckets:
- `products` (público)
- `banners` (público)
- `blog` (público)
- `logos` (público — se crea automáticamente al subir el primer logo)
- `private` (privado)

---

## 5. Crear proyecto Vercel — Sitio público (`apps/web`)

### 5.1 Conectar repositorio

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Hacer clic en **"Import Git Repository"**
3. Seleccionar el repo `merkiai` de GitHub
4. Autorizar el acceso si se pide

### 5.2 Configurar el proyecto

En la pantalla de configuración del nuevo proyecto:

| Campo | Valor |
|-------|-------|
| **Project Name** | `merkiai-web` |
| **Framework Preset** | `Next.js` (detección automática) |
| **Root Directory** | `apps/web` |
| **Build Command** | `cd ../.. && pnpm turbo build --filter=@merkiai/web` |
| **Output Directory** | `.next` *(relativo a `apps/web` — dejar por defecto)* |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |
| **Node.js Version** | `20.x` |

> **Por qué Root Directory = `apps/web`:** Vercel detecta la versión de Next.js leyendo el `package.json` del Root Directory. Si se deja en blanco apunta al `package.json` de la raíz del monorepo, que no tiene `next` como dependencia y falla con *"No Next.js version detected"*.

> **Por qué `cd ../..` en los comandos:** Vercel ejecuta los comandos desde el Root Directory (`apps/web`). El `cd ../..` sube a la raíz del monorepo para que `pnpm install` instale todos los `packages/*` del workspace y Turborepo resuelva las dependencias correctamente.

> **Nombre del filtro:** Debe coincidir con `"name"` en `apps/web/package.json` → `@merkiai/web`.

### 5.3 vercel.json — **método recomendado**

El `vercel.json` en `apps/web/` tiene prioridad sobre cualquier campo configurado en la UI de Vercel. Esto evita que Vercel use sus propios defaults y garantiza que el comando sea siempre el correcto.

El archivo ya está creado en el repositorio en `apps/web/vercel.json`:

```json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=@merkiai/web",
  "outputDirectory": ".next",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

> Con este archivo en el repo, los campos **Build Command** e **Install Command** en la UI de Vercel quedan sobreescritos. Se pueden dejar en blanco en la UI.

> **Error frecuente:** `pnpm build --filter=web` falla porque pnpm interpreta `--filter=web` como un filtro de workspace (busca el paquete con `"name": "web"`). El comando correcto invoca `turbo` directamente: `pnpm turbo build --filter=@merkiai/web`.

### 5.4 Agregar variables de entorno

En la sección **Environment Variables** durante la creación (o luego en Settings → Environment Variables):

Ver la referencia completa en la [sección 15](#15-variables-de-entorno--referencia-completa).

Las mínimas para que la app arranque:

```
NEXT_PUBLIC_SUPABASE_URL          = https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY         = eyJ...
NEXT_PUBLIC_SITE_URL              = https://tienda.example.com
```

### 5.5 Hacer el primer deploy

Hacer clic en **"Deploy"**. El primer build puede tardar 3–5 minutos.

Si el build falla, revisar el log en la pestaña **Deployments** → clic en el deploy fallido → **Build Logs**.

---

## 6. Crear proyecto Vercel — Panel admin (`apps/admin`)

### 6.1 Crear segundo proyecto

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar el **mismo repositorio** `merkiai`
3. En la pantalla de configuración:

| Campo | Valor |
|-------|-------|
| **Project Name** | `merkiai-admin` |
| **Framework Preset** | `Next.js` |
| **Root Directory** | `apps/admin` |
| **Build Command** | `cd ../.. && pnpm turbo build --filter=@merkiai/admin` |
| **Output Directory** | `.next` *(relativo a `apps/admin` — dejar por defecto)* |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |
| **Node.js Version** | `20.x` |

> El filtro `@merkiai/admin` coincide con `"name": "@merkiai/admin"` en `apps/admin/package.json`. La misma lógica que el proyecto web: Root Directory apunta a la app para que Vercel detecte Next.js, y los comandos suben a la raíz para instalar todo el workspace.

### 6.2 vercel.json — **método recomendado**

El archivo ya está creado en el repositorio en `apps/admin/vercel.json`:

```json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=@merkiai/admin",
  "outputDirectory": ".next",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

> Mismo principio que el proyecto web: el `vercel.json` sobreescribe cualquier campo en la UI de Vercel.

### 6.3 Variables de entorno del admin

Las mínimas para el panel admin:

```
NEXT_PUBLIC_SUPABASE_URL          = https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY         = eyJ...
NEXT_PUBLIC_ADMIN_URL             = https://admin.tienda.example.com
```

---

## 7. Variables de entorno

### Cómo agregarlas en Vercel

1. Ir al proyecto en Vercel → **Settings** → **Environment Variables**
2. Para cada variable: ingresar **Name**, **Value** y seleccionar los **Environments** (Production, Preview, Development)
3. Hacer clic en **Save**
4. **Redeploy** el proyecto para que tome efecto (Deployments → ··· → Redeploy)

### Entornos de Vercel

| Entorno Vercel | Cuándo aplica | Consejo |
|----------------|---------------|---------|
| **Production** | Push a `main` | Usar keys de producción (Supabase prod) |
| **Preview** | Pull Requests y otras ramas | Usar keys de staging (Supabase staging) |
| **Development** | `vercel dev` en local | No es necesario configurar aquí |

> **Seguridad:** Las variables sin prefijo `NEXT_PUBLIC_` son secretas y solo están disponibles en el servidor. Las que tienen `NEXT_PUBLIC_` son expuestas al navegador. **Nunca poner secrets en variables NEXT_PUBLIC_.**

---

## 8. Configuración de dominios y DNS

### 8.1 Agregar dominio al proyecto web

1. En **merkiai-web** → **Settings** → **Domains**
2. Agregar `tienda.example.com` y `www.tienda.example.com`
3. Vercel mostrará los registros DNS que debes configurar

### 8.2 Agregar dominio al proyecto admin

1. En **merkiai-admin** → **Settings** → **Domains**
2. Agregar `admin.tienda.example.com`
3. Vercel mostrará el registro DNS para el subdominio

### 8.3 Registros DNS a configurar en tu proveedor

Ir al panel de administración DNS de tu dominio (ej. GoDaddy, Namecheap, Cloudflare, etc.) y crear:

#### Para tienda.example.com (dominio raíz + www)

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| `A` | `@` | `76.76.21.21` | Auto |
| `CNAME` | `www` | `cname.vercel-dns.com` | Auto |

#### Para admin.tienda.example.com

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| `CNAME` | `admin` | `cname.vercel-dns.com` | Auto |

> **Si usas Cloudflare:** Desactivar el proxy (nube naranja → nube gris) para los registros que apuntan a Vercel, ya que Vercel gestiona su propio SSL y el doble proxy puede causar errores.

### 8.4 Verificar SSL

Vercel provee certificados SSL automáticos via Let's Encrypt. La verificación puede tardar hasta 5 minutos tras configurar el DNS. El estado aparece en **Settings → Domains** como ✅ Valid Configuration.

### 8.5 Redirección www → sin www

En **merkiai-web** → **Settings** → **Domains**, Vercel redirige automáticamente `www.tienda.example.com` → `tienda.example.com` (o viceversa). Seleccionar `tienda.example.com` como dominio primario.

---

## 9. Webhooks de Skydropx

El endpoint `POST /api/webhooks/skydropx` recibe notificaciones de Skydropx cuando el estado de un envío cambia. Debe registrarse en el dashboard de Skydropx con la URL de producción:

```
https://tienda.example.com/api/webhooks/skydropx
```

### Configurar en Skydropx

1. Iniciar sesión en el dashboard de Skydropx
2. Ir a **Configuración → Webhooks**
3. Agregar la URL: `https://tienda.example.com/api/webhooks/skydropx`
4. Seleccionar los eventos:
   - `shipment.in_transit`
   - `shipment.out_for_delivery`
   - `shipment.delivered`
   - `shipment.exception`
5. Guardar

### Eventos y estado resultante

| Evento Skydropx | Status en BD |
|----------------|--------------|
| `shipment.in_transit` | `shipped` |
| `shipment.out_for_delivery` | `shipped` |
| `shipment.delivered` | `delivered` |
| `shipment.exception` | `exception` |

### Webhooks de pago

Además del de envíos, registra la **URL de webhook de la pasarela activa** en su panel (la URL exacta aparece copiable en Admin → Pagos):

- Wompi → `https://<sitio>/api/webhooks/wompi` (Eventos)
- MercadoPago → `https://<sitio>/api/webhooks/mercadopago` (Notificaciones/Webhooks)
- Bold → `https://<sitio>/api/webhooks/bold`
- Tu Compra → `https://<sitio>/api/webhooks/tucompra` como **URL de Confirmación**, y **URL de Retorno** = `https://<sitio>/checkout/confirmation`

Seguridad de estos webhooks: firma verificada por pasarela + re-consulta a la API, idempotencia por id de evento y verificación de monto (anti-subpago). Detalle en `Tu-Compra-Integracion-Referencia.md` §11.5.

---

## 10. Pipeline CI/CD automático

Una vez conectado el repositorio, Vercel despliega automáticamente en cada push:

```
Developer                    GitHub                      Vercel
    │                           │                           │
    ├── git push origin main ──▶│                           │
    │                           ├── trigger build ─────────▶│
    │                           │                           ├── pnpm install
    │                           │                           ├── turbo build --filter=@merkiai/web|@merkiai/admin
    │                           │                           ├── deploy to CDN
    │                           │◀── notify status ─────────┤
    │◀── GitHub check status ───┤                           │
```

### Pull Requests → Preview Deployments

Cada PR abierto contra `main` genera automáticamente una URL de preview:

```
https://merkiai-web-git-feat-nueva-feature-<org>.vercel.app
```

Esta URL es única por branch y se actualiza con cada push al PR. Útil para QA antes de mergear.

### Configurar notificaciones de deploy

En **merkiai-web** → **Settings** → **Git** → **Deploy Hooks** se puede agregar un webhook para notificar a Slack/Teams cuando el deploy termina.

### Evitar deploys innecesarios

Si solo cambia un archivo de documentación y no se quiere activar un build, agregar `[skip ci]` al mensaje del commit:

```bash
git commit -m "docs: actualizar README [skip ci]"
```

---

## 11. Fuentes tipográficas en producción

Las fuentes `typogama-ahsing.otf` y `Geeeki-Regular.otf` **deben estar en el repositorio** antes del build. Vercel no tiene acceso a archivos locales.

### Verificar que están incluidas

```bash
ls apps/web/public/fonts/
# typogama-ahsing.otf  Geeeki-Regular.otf

ls apps/admin/public/fonts/
# typogama-ahsing.otf  Geeeki-Regular.otf
```

Si el repositorio es público y las fuentes tienen licencia restrictiva, considerar:

1. **Repositorio privado en GitHub** (recomendado)
2. Alojar las fuentes en Supabase Storage o un CDN y actualizar las URLs en `globals.css`

### Referencia en globals.css

```css
/* apps/web/src/app/globals.css */
@font-face {
  font-family: 'Ahsing';
  src: url('/fonts/typogama-ahsing.otf') format('opentype');
  font-display: swap;
}

@font-face {
  font-family: 'Geeeki';
  src: url('/fonts/Geeeki-Regular.otf') format('opentype');
  font-display: swap;
}
```

---

## 12. Configuración post-deploy

Después de que ambas apps estén desplegadas y los dominios configurados:

### 12.0 Crear el primer super_admin

Este es el **primer paso obligatorio** antes de usar el panel. Sin él, nadie puede entrar al admin.

**Paso 1 — Insertar el profile en Supabase**

En el **SQL Editor** de Supabase, ejecuta:

```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  gen_random_uuid(),
  'tu@email.com',   -- el email con el que iniciarás sesión
  'Tu Nombre',
  'super_admin'
);
```

> Reemplaza `tu@email.com` y `Tu Nombre` con tus datos reales. Este email debe ser el mismo que usarás para iniciar sesión en Stack Auth.

**Paso 2 — Crear la cuenta en Stack Auth**

El admin no tiene formulario de registro (está deshabilitado). Para crear la cuenta:

1. Ve a `https://admin.tienda.example.com/handler/sign-in`
2. Haz clic en **"¿Olvidaste tu contraseña?"**
3. Ingresa el mismo email que pusiste en Supabase
4. Stack Auth enviará un correo para crear/restablecer la contraseña
5. Sigue el link del correo y define tu contraseña

**Paso 3 — Verificar acceso**

Inicia sesión con email y contraseña. Deberías ver el panel completo con la sección **Usuarios** en el menú lateral.

> **¿Por qué este orden?** El middleware verifica primero la sesión de Stack Auth, y luego el layout busca el `email` en `profiles`. Si el profile no existe, el sistema redirige a `/no-autorizado`. El profile debe existir antes del primer login.

**Agregar más usuarios admin (desde el panel)**

Una vez que el super_admin ha ingresado:

1. Ve a `/usuarios` en el panel
2. Clic en **"Agregar usuario"**
3. Ingresa email, nombre y rol (`Admin`, `Vendedor` o `Gestor de Tienda`)
4. El nuevo usuario debe ir a `https://admin.tienda.example.com/handler/sign-in`, usar "¿Olvidaste tu contraseña?" y crear su contraseña

Los roles disponibles y sus permisos:

| Rol | Acceso |
|-----|--------|
| `Admin` | Todo el panel (sin gestión de usuarios) |
| `Vendedor` | Productos, Categorías, Pedidos, Clientes |
| `Gestor de Tienda` | Banners, Blog, Configuración General |

---

### 12.1 Configurar proveedor de envíos

1. Ir a `https://admin.tienda.example.com/configuracion`
2. Sección **Proveedor de envíos**
3. Si vas a usar Skydropx: ingresar Client ID, Client Secret y Address From ID
4. Si usas tarifa fija: definir el valor en COP (ej. `8000`)
5. Guardar

### 12.2 Configurar logo y WhatsApp

1. Ir a `https://admin.tienda.example.com/configuracion`
2. Sección **Identidad de la tienda**
3. Subir el logo (se guardará en el bucket `logos` de Supabase)
4. Ingresar el número de WhatsApp en formato internacional: `573001234567`
5. Guardar

Estos valores se aplican inmediatamente en el sitio público (Navbar, Footer, CTAs de maquila y asesorías).

### 12.3 Crear categorías

1. Ir a `https://admin.tienda.example.com/categorias`
2. Crear las categorías iniciales (ej. "Café de Especialidad", "Blend", "Microlote")

### 12.4 Crear primeros productos

1. Ir a `https://admin.tienda.example.com/productos/nuevo`
2. Completar nombre, slug, imágenes, variantes y precios
3. Activar el producto

### 12.5 Configurar banners del hero

1. Ir a `https://admin.tienda.example.com/banners`
2. Subir imágenes para desktop y mobile en cada slide
3. Definir título, subtítulo y CTA

---

## 13. Checklist pre-deploy

Completar antes de hacer el primer deploy a producción:

### Código

- [ ] `pnpm lint` pasa sin errores en todas las apps
- [ ] `pnpm type-check` pasa sin errores de TypeScript
- [ ] `pnpm test` — todas las suites pasan (database 160 · web 316 · admin 165)
- [ ] No hay `console.log` de debug en el código
- [ ] No hay credenciales hardcodeadas en el código

### Supabase (producción)

- [ ] Schema aplicado: `01_schema.sql` (BD nueva) o `upgrade.sql` (BD existente, hasta la migración 29)
- [ ] RLS activado en todas las tablas (verificar en **Authentication → Policies**)
- [ ] Buckets de Storage creados: `products`, `banners`, `blog`, `private`
- [ ] Políticas de Storage configuradas (público/privado según la tabla)
- [ ] Service Role Key copiada (necesaria para las API routes del servidor)

### Vercel — merkiai-web

- [ ] Root Directory: `apps/web`
- [ ] Build Command: `cd ../.. && pnpm turbo build --filter=@merkiai/web`
- [ ] Output Directory: `.next` (por defecto)
- [ ] Install Command: `cd ../.. && pnpm install --frozen-lockfile`
- [ ] Node.js 20.x seleccionado
- [ ] Variables de entorno de producción configuradas (todas las de la lista de la sección 15)
- [ ] Primer build exitoso (sin errores en Build Logs)
- [ ] Dominio `tienda.example.com` agregado y con SSL válido

### Vercel — merkiai-admin

- [ ] Root Directory: `apps/admin`
- [ ] Build Command: `cd ../.. && pnpm turbo build --filter=@merkiai/admin`
- [ ] Output Directory: `.next` (por defecto)
- [ ] Install Command: `cd ../.. && pnpm install --frozen-lockfile`
- [ ] Node.js 20.x seleccionado
- [ ] Variables de entorno de producción configuradas
- [ ] Primer build exitoso
- [ ] Dominio `admin.tienda.example.com` agregado y con SSL válido

### DNS

- [ ] Registro `A` para `tienda.example.com` apuntando a `76.76.21.21`
- [ ] Registro `CNAME` para `www` apuntando a `cname.vercel-dns.com`
- [ ] Registro `CNAME` para `admin` apuntando a `cname.vercel-dns.com`
- [ ] Propagación DNS verificada (puede tardar hasta 24h; normalmente < 30 min)

### Post-deploy

- [ ] **Crear super_admin** — INSERT en `profiles` (ver sección 12.0)
- [ ] Ir a `https://admin.tienda.example.com/handler/sign-in` → "¿Olvidaste tu contraseña?" con el email del super_admin
- [ ] Confirmar que el link del correo funciona y permite crear contraseña
- [ ] Iniciar sesión como super_admin — dashboard accesible con sección Usuarios visible
- [ ] Abrir `https://tienda.example.com` — Home carga correctamente
- [ ] Abrir `https://tienda.example.com/tienda` — Catálogo visible
- [ ] Subir logo desde `/configuracion` — aparece en el sitio
- [ ] Ingresar número de WhatsApp — CTAs funcionan
- [ ] Webhook de Skydropx registrado en el dashboard de Skydropx

---

## 14. Rollback y gestión de incidencias

### Rollback rápido en Vercel

Si un deploy rompe producción:

1. Ir al proyecto en Vercel → **Deployments**
2. Buscar el último deploy estable (estado ✅ Ready)
3. Hacer clic en **···** → **Promote to Production**

Esto redirige el tráfico al deploy anterior en menos de 30 segundos, sin necesidad de hacer un nuevo commit.

### Modo mantenimiento

Para activar la página de mantenimiento sin redesplegar:

1. En Vercel → **Settings** → **Environment Variables**
2. Agregar o editar `MAINTENANCE_MODE = true`
3. Hacer clic en **Save** y luego **Redeploy** (solo el proyecto `web`)

Para desactivar: cambiar a `MAINTENANCE_MODE = false` y redeploy.

### Ver logs en tiempo real

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Ver logs del proyecto web en producción
vercel logs merkiai-web --follow

# Ver logs del admin
vercel logs merkiai-admin --follow
```

### Alertas de error

Configurar alertas en Vercel → **Observability** → **Alerts** para recibir notificaciones cuando:
- Un deploy falla
- El error rate supera un umbral
- El tiempo de respuesta p99 sube

---

## 15. Variables de entorno — referencia completa

### Supabase (ambas apps — `apps/web` y `apps/admin`)

| Variable | Tipo | Descripción | Ejemplo |
|----------|------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL del proyecto Supabase | `https://abcdefgh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Pública | Clave anónima (anon key) | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secreta** | Clave de servicio (service_role) — solo servidor | `eyJhbGci...` |

> Obtener en: Supabase Dashboard → Project Settings → API

### URLs del sitio

| Variable | App | Descripción | Ejemplo |
|----------|-----|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | web | URL pública del sitio | `https://tienda.example.com` |
| `NEXT_PUBLIC_ADMIN_URL` | admin | URL del panel admin | `https://admin.tienda.example.com` |

### Pasarelas de pago — *(configuradas desde el admin, NO por variables de entorno)*

Las credenciales de las pasarelas **no** son variables de entorno: se guardan en la tabla `payment_config` (singleton, solo `service_role`) y se gestionan en **Admin → Configuración → Pagos**. Una sola pasarela activa a la vez (`active_provider`).

| Pasarela | Campos que se configuran en el admin |
|----------|--------------------------------------|
| Wompi | Llave pública, privada, de integridad y de eventos (webhook) |
| MercadoPago | Public Key, Access Token, **clave secreta del webhook** (`x-signature`) |
| Tu Compra (integrador) | Usuario, clave, terminal, URL base (Demo/Prod), **llave de encriptación** (firma) + medios habilitados (PSE/Nequi/Daviplata/Referenciado) |
| Bold | Llave de identidad (API key), llave secreta (webhook), sandbox |

> Único requisito de entorno: `NEXT_PUBLIC_SITE_URL` (para construir las URLs de webhook/retorno que se pegan en cada panel). Registrar en cada pasarela: `https://<sitio>/api/webhooks/{wompi|mercadopago|tucompra|bold}` (Tu Compra: como "URL de Confirmación"; y "URL de Retorno" = `https://<sitio>/checkout/confirmation`).

### Emails con Resend — *(pendiente de integrar)*

| Variable | App | Descripción | Ejemplo |
|----------|-----|-------------|---------|
| `RESEND_API_KEY` | web | Clave de la API de Resend (**secreta**) | `re_...` |
| `RESEND_FROM_EMAIL` | web | Email del remitente | `pedidos@tienda.example.com` |

> Obtener en: [resend.com/api-keys](https://resend.com/api-keys)

### Modo mantenimiento

| Variable | App | Descripción | Valores |
|----------|-----|-------------|---------|
| `MAINTENANCE_MODE` | web | Activa la página de mantenimiento | `true` / `false` |

### Autenticación Stack Auth (Hexclave)

**Web y admin usan proyectos de Stack Auth distintos** (identidades separadas). Cada app lleva **sus** tres variables:

| Variable | App | Descripción |
|----------|-----|-------------|
| `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` | web / admin (valores distintos) | ID del proyecto en Stack Auth |
| `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY` | web / admin | Clave pública (`pck_...`) |
| `HEXCLAVE_SECRET_SERVER_KEY` | web / admin | Clave secreta (`ssk_...`, **secreta**) |

> Ver `STACK_AUTH_SETUP.md` para el detalle. En **multi-tenant (E17)** se suma un **tercer** proyecto Stack Auth para el control plane, y el admin usa **Teams + RBAC** (ver sección 16 y `STACK_AUTH_SETUP.md` → multi-tenant).

### Multi-tenant / SaaS — *(roadmap E17, ver sección 16)*

| Variable | App | Descripción |
|----------|-----|-------------|
| `SUPABASE_JWT_SECRET` | web + admin | Secreto para firmar el JWT de Supabase con el claim `tenant_id` (RLS por tenant) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | web + admin | Dominio raíz para resolver subdominios (`merkiai.com`) |
| `CONTROL_PLANE_URL` | web + admin | API interna del control plane para resolver `host→tenant_id→db_ref` |
| `BILLING_PROVIDER` / `BILLING_API_KEY` / `BILLING_WEBHOOK_SECRET` | control-plane | Facturación de suscripción a los tenants |

> En multi-tenant hay **dos proyectos Supabase**: el del **plano de tienda** (web+admin, sin service-role) y el de **plataforma** (solo control-plane, con service-role). No mezclar sus keys.

> **Nota:** Las credenciales de Skydropx y el número de WhatsApp **NO** son variables de entorno. Se gestionan directamente desde el panel admin en `/configuracion` y se guardan en Supabase.

---

## 16. Despliegue multi-tenant + SaaS (roadmap E17)

> **Estado:** 🔲 roadmap (E17). Esta sección describe cómo cambia el despliegue al pasar de una tienda a **muchos tenants desde un mismo despliegue**. **No aplica al modelo single-tenant actual.** Fuente de verdad de la arquitectura: `PRODUCT_BACKLOG.md` → *Detalle · E17 · Arquitectura de referencia*.

### 16.1 Regla base: la infraestructura NO se multiplica por cliente

Se despliegan **tres apps fijas** (no una por tenant); cada tenant se resuelve por el **host** de la petición.

```
GitHub (monorepo merkiai)
        │
        ├──▶ Vercel: merkiai-web          (apps/web)    → *.merkiai.com  (+ dominios propios)
        ├──▶ Vercel: merkiai-admin         (apps/admin)  → admin.merkiai.com (o {tenant}.merkiai.com/admin)
        └──▶ Vercel: merkiai-console  (apps/console) → app.merkiai.com  (operador SaaS)
```

| Proyecto Vercel | App | Plano | Dominio |
|-----------------|-----|-------|---------|
| `merkiai-web` | `apps/web` | tienda (storefront) | wildcard `*.merkiai.com` + dominios propios por tenant |
| `merkiai-admin` | `apps/admin` | tienda (operadores) | `admin.merkiai.com` |
| `merkiai-console` | `apps/console` | **plataforma (Merkiai)** | `app.merkiai.com` |

Dar de alta un tenant **no** crea proyectos ni infraestructura: es crear el Team (Stack Auth) + fila `tenants` + seed + asignar subdominio, desde el control plane.

### 16.2 Bases de datos: DOS proyectos Supabase

Este es el cambio clave respecto al modelo actual (una sola BD):

| Proyecto Supabase | Contiene | Quién accede | RLS |
|-------------------|----------|--------------|-----|
| **BD de plataforma** *(propia de Merkiai, proyecto dedicado desde el día 1)* | `tenants`, `plans`, `subscriptions`, billing, dominios, **`db_ref`** (routing), auditoría de plataforma | **solo** `merkiai-console` con `service-role` | sin RLS de tenant |
| **BD del plano de tienda** | productos, pedidos, clientes, páginas, config, temas… *tenant-scoped* | `merkiai-web` y `merkiai-admin` (la **comparten**) con rol `authenticated` + JWT `tenant_id` | RLS por tenant, **frontera dura** |

- **`merkiai-web`/`admin` nunca usan `service-role`** (omite RLS); solo el control plane lo usa, y **solo sobre su BD de plataforma**.
- El plano de tienda resuelve `host → tenant_id → db_ref` contra el registro de plataforma vía **API interna/caché del control plane** (no accede directo a la BD de plataforma).
- Aislamiento por plan (HU-200): un tenant puede estar en la BD compartida (default), un schema dedicado o **BD/proyecto dedicado** (Supabase propio o **Neon** a escala) — el `connection factory` de `@merkiai/tenancy` enruta por `db_ref`.

### 16.3 Variables de entorno por app (multi-tenant)

**`merkiai-web` y `merkiai-admin`** (plano de tienda):
```
NEXT_PUBLIC_SUPABASE_URL            = https://<tenant-plane>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= <anon key del proyecto plano de tienda>
SUPABASE_JWT_SECRET                 = <secreto JWT para firmar el claim tenant_id>   # ⟵ nuevo
# ⚠️ NO usar SUPABASE_SERVICE_ROLE_KEY en el plano de tienda
NEXT_PUBLIC_ROOT_DOMAIN             = merkiai.com    # para resolver subdominios
CONTROL_PLANE_URL                   = https://app.merkiai.com   # API interna de routing
```

**`merkiai-console`** (plataforma — su propio proyecto Supabase):
```
NEXT_PUBLIC_SUPABASE_URL            = https://<platform-db>.supabase.co   # ⟵ proyecto distinto
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= <anon key del proyecto de plataforma>
SUPABASE_SERVICE_ROLE_KEY           = <service-role del proyecto de plataforma>   # solo aquí
# Stack Auth (proyecto de operadores de plataforma)
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID     = <proyecto control-plane>
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY = pck_...
HEXCLAVE_SECRET_SERVER_KEY          = ssk_...
# Billing (cobro de suscripción a los tenants)
BILLING_PROVIDER                    = mercadopago | payzen | stripe
BILLING_API_KEY / BILLING_WEBHOOK_SECRET = ...
```

> **Tres proyectos de Stack Auth** en multi-tenant: web (compradores), admin/operadores de tienda (con **Teams = tenants** + RBAC) y control-plane (operadores de plataforma, *Project Permission* `platform:operate`). Ver `STACK_AUTH_SETUP.md` → *Configuración para multi-tenant*.

### 16.4 Dominios: subdominio por defecto + dominio propio del tenant

**Por defecto — subdominio de Merkiai (wildcard):**

| Tipo | Nombre | Valor | Notas |
|------|--------|-------|-------|
| `CNAME` | `*` | `cname.vercel-dns.com` | wildcard `*.merkiai.com` → `merkiai-web`. El middleware resuelve el tenant por `Host` |

**Opcional — dominio propio del tenant (HU-174), máquina de estados:**

`pendiente → validación DNS → emisión de certificado (TLS) → propagación CDN → activo`

- Se **delega al host/CDN** la emisión del cert y la propagación — **no** implementar ACME propio. Recomendado **Cloudflare for SaaS (custom hostnames)** o **Vercel Domains** (agregar el dominio del tenant al proyecto `merkiai-web` vía su API).
- Al tenant se le muestran los registros DNS a crear (CNAME + token de verificación); renovación automática; **un dominio → un solo tenant** (anti-takeover).
- Aplica al **storefront**; el admin del tenant queda en `admin.merkiai.com` o `{tenant}.merkiai.com/admin`.

**Dominio de envío de correo por tenant (HU-175):** `pendiente → validación DNS (SPF/DKIM/DMARC + return-path) → verificado/activo`, verificado vía el proveedor de email (SES/Postmark). Sin cert/CDN. Si no se configura, los correos salen con el **dominio de plataforma de Merkiai** (fallback).

### 16.5 Migraciones en modelo multi-tenant

- La **BD de plataforma** y la **BD del plano de tienda** tienen esquemas y migraciones **separados**.
- El esquema del plano de tienda se aplica a **todos los destinos** (BD compartida + schemas + BDs dedicadas) de forma consistente (HU-200 · AC-5): el pipeline de migración debe **iterar sobre los `db_ref` registrados**.

---

## Diagrama de flujo completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub (monorepo)                            │
│                                                                     │
│  main branch                feat/* branches                         │
│      │                           │                                  │
│      │ push                      │ PR abierto                       │
└──────┼───────────────────────────┼──────────────────────────────────┘
       │                           │
       ▼                           ▼
┌──────────────────────────────────────────────────────────────────── ┐
│                          Vercel CI                                  │
│                                                                     │
│  turbo build --filter=@merkiai/web  turbo build --filter=@merkiai/admin     │
│         │                               │                           │
│  Production Deploy              Production Deploy                   │
│  tienda.example.com                  admin.tienda.example.com                 │
└──────────────────────────────────────────────────────────────────── ┘
       │                           │
       ▼                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Supabase (producción)                       │
│                                                                     │
│  PostgreSQL + RLS              Storage Buckets                      │
│  ├── profiles (admin users)    ├── products  (público)              │
│  ├── customers (web buyers)    ├── banners   (público)              │
│  ├── customer_addresses        ├── blog      (público)              │
│  ├── products / orders         ├── logos     (público)              │
│  ├── store_config (logo/wa)    └── private  (privado)              │
│  └── shipping_config                                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

*Merkiai · Parquesoft TI · Agosto 2026 (añadida §16 despliegue multi-tenant/SaaS: control-plane + BD de plataforma en proyecto Supabase propio, dominios y correo por tenant)*
