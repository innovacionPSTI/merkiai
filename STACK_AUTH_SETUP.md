# Stack Auth — Guía de Configuración

> **Proyecto:** Merkiai  
> **Paquete:** `@stackframe/stack` v2.7.4  
> **Aplica a:** `apps/web` y `apps/admin`

---

## ¿Qué es Stack Auth?

Stack Auth es el proveedor de autenticación del proyecto. Maneja el registro, inicio de sesión, cierre de sesión, verificación de email y recuperación de contraseña. La integración ya está lista en el código — solo necesitas crear la cuenta, configurar el proyecto y agregar las variables de entorno.

---

## Paso 1 — Crear la cuenta en Stack Auth

1. Ve a **[https://app.stack-auth.com](https://app.stack-auth.com)**
2. Haz clic en **"Sign up"**
3. Regístrate con email y contraseña (o con GitHub)
4. Verifica tu email cuando llegue el correo de confirmación

---

## Paso 2 — Crear el proyecto

1. En el dashboard, haz clic en **"New Project"**
2. Asigna el nombre: `Merkiai`
3. Selecciona el plan **Free** (suficiente para desarrollo y para producción con bajo volumen)
4. Haz clic en **"Create Project"**

Esto creará un proyecto con un `Project ID` único.

> **Nota:** necesitas **dos proyectos** de Stack Auth: uno para la **web** (`Merkiai`) y otro para el **admin** (`Merkiai Admin`). Repite este paso para crear el segundo. Cada uno tiene sus propias keys, dominios y usuarios (ver Paso 7 y Paso 10).

---

## Paso 3 — Configurar métodos de autenticación

En el panel de tu proyecto, ve a **"Auth" → "Providers"**:

1. Asegúrate de que **Email/Password** esté habilitado (viene activado por defecto)
2. Si quieres agregar Google OAuth en el futuro:
   - Activa **"Google"**
   - Ingresa `Client ID` y `Client Secret` desde Google Cloud Console

> Por ahora solo se usa Email/Password. Puedes activar Google más adelante sin cambios en el código.

---

## Paso 4 — Configurar URLs permitidas

Ve a **"Auth" → "Domains & URLs"** y agrega las URLs correspondientes **en cada proyecto** (las de la web en el proyecto web, las del admin en el proyecto admin):

### Para desarrollo (localhost)
```
# Proyecto WEB
http://localhost:3000
# Proyecto ADMIN
http://localhost:3001
```

### Para producción (cuando se despliegue)
```
https://tienda.example.com
https://admin.tienda.example.com
```

> Stack Auth valida el origen de las peticiones. Si no agregas estas URLs, el login no funcionará.

---

## Paso 5 — Configurar las URLs de redirección

En **"Auth" → "Domains & URLs"**, sección **"Redirect URLs"**, agrega:

```
http://localhost:3000/handler
http://localhost:3001/handler
https://tienda.example.com/handler
https://admin.tienda.example.com/handler
```

Estos son los endpoints del catch-all handler de Stack Auth (`/app/handler/[...stack]/page.tsx`).

---

## Paso 6 — Obtener las API Keys

Ve a **"API Keys"** en el menú lateral del proyecto. Encontrarás tres valores:

| Variable de entorno | Dónde encontrarla en Stack Auth | Empieza con |
|---|---|---|
| `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` | "Project ID" | `proj_...` |
| `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY` | "Publishable Client Key" | `pck_...` |
| `HEXCLAVE_SECRET_SERVER_KEY` | "Secret Server Key" | `ssk_...` |

> La **Secret Server Key** (`ssk_...`) nunca debe exponerse al cliente ni committearse al repositorio. Solo va en `.env.local` del servidor.

---

## Paso 7 — Configurar las variables de entorno

### En `apps/web/.env.local`

Abre (o crea) el archivo `apps/web/.env.local` y agrega:

```env
# --- Stack Auth ---
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID=proj_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY=pck_xxxxxxxxxxxxxxxxxxxxxxxx
HEXCLAVE_SECRET_SERVER_KEY=ssk_xxxxxxxxxxxxxxxxxxxxxxxx
```

### En `apps/admin/.env.local`

El panel admin usa **su propio proyecto de Stack Auth** (distinto al de la web). Crea un segundo proyecto (repite los Pasos 2–6 con nombre `Merkiai Admin`) y agrega **sus** tres variables en `apps/admin/.env.local`:

```env
# --- Stack Auth (proyecto ADMIN, distinto al de la web) ---
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID=proj_admin_xxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY=pck_admin_xxxxxxxxxxxxxxxx
HEXCLAVE_SECRET_SERVER_KEY=ssk_admin_xxxxxxxxxxxxxxxx
```

> **Web y admin son dos proyectos de Stack Auth separados**, cada uno con sus propias keys. Las identidades no se comparten entre ambos (un comprador de la web no puede entrar al admin y viceversa).

---

## Paso 8 — Instalar las dependencias

Desde la raíz del monorepo:

```bash
pnpm install
```

Esto instalará `@stackframe/stack` en `apps/web` y `apps/admin` (ya está declarado en ambos `package.json`).

---

## Paso 9 — Verificar que funciona

Levanta el proyecto:

```bash
pnpm dev
```

Prueba el flujo completo:

1. Ve a `http://localhost:3000/registro` → crea una cuenta
2. Verifica que llega el email de verificación (si está configurado)
3. Ve a `http://localhost:3000/login` → inicia sesión
4. Confirma que redirige a `/mi-cuenta` y muestra tu nombre
5. Haz clic en **"Cerrar sesión"** → debe redirigir a `/`
6. Ve a `http://localhost:3000/mi-cuenta` sin sesión → debe redirigir a `/login`
7. Ve a `http://localhost:3001` → debe redirigir a `/handler/sign-in` sin sesión

---

## Paso 10 — Configuración específica del panel Admin

El panel admin (`apps/admin`) tiene requisitos adicionales en Stack Auth:

### Proyectos separados: web y admin tienen su propio proyecto de Stack Auth

**La web (`apps/web`) y el admin (`apps/admin`) usan proyectos de Stack Auth distintos** (cada uno con su propio `Project ID`, `Publishable Client Key` y `Secret Server Key`). Las identidades **no se comparten**: una cuenta creada en la web no existe en el admin y viceversa. Esto aísla a los compradores de los operadores del panel.

### Sign-up en el admin — deshabilitado en el dashboard + protegido por código

Como el admin tiene su **propio** proyecto, **sí puedes (y conviene) deshabilitar el auto-registro** en el dashboard de Stack Auth del proyecto **admin** (Auth → sign-up off), sin afectar el registro de compradores en la web. Además, el acceso admin está protegido por código como defensa en profundidad:

1. **`middleware.ts`** — redirige `/handler/sign-up` → `/handler/sign-in` antes de que la página cargue
2. **`layout.tsx`** — llama a `getAdminUser()` en cada request; si el email no tiene una fila en `profiles` con rol admin, redirige a `/no-autorizado`

Esto significa que aunque alguien llegara a crear una cuenta Stack Auth con un email no registrado, no tendría acceso al panel.

### Roles y permisos — NO configurar en Stack Auth

> **Importante (modelo actual single-tenant):** El sistema de roles de Merkiai está implementado en Supabase (`profiles.role`), **no** en Stack Auth. No es necesario crear roles, permisos ni equipos en Stack Auth para el panel admin. Stack Auth solo maneja la identidad (quién eres); Supabase maneja la autorización (qué puedes hacer).

Esto es intencional: los roles viven junto a los datos del negocio, son inmediatamente efectivos al cambiar (sin esperar expiración de token) y son auditables directamente en SQL.

> **⚠️ Cambia en multi-tenant (E17):** cuando se adopte la plataforma multi-tienda, **sí** se usan **Teams** (= tenants) y **RBAC** de Stack Auth (Team Permissions para roles por tienda, Project Permissions para el operador de plataforma), además de la RLS por tenant en Supabase. Ver la sección **"Configuración para multi-tenant + Supabase RLS (roadmap E17)"** más abajo.

### Dominios de confianza para emails del admin

Para que los links de "Restablecer contraseña" que llegan por email apunten correctamente al admin (y no al sitio web):

1. Ve a **"Auth" → "Domains & URLs"**
2. Confirma que `https://admin.tienda.example.com` y `http://localhost:3001` están en la lista

Sin esto, los nuevos usuarios admin no podrán crear su contraseña desde el link del correo.

---

## Paso 11 — (Opcional) Configurar verificación de email

Por defecto Stack Auth no requiere verificación de email para iniciar sesión. Para habilitarla:

1. Ve a **"Auth" → "Email"** en el panel de Stack Auth
2. Activa **"Require email verification"**
3. Personaliza el template del email de verificación si lo deseas

> Si activas esto en producción, asegúrate de configurar un dominio de email propio en Stack Auth (Settings → Email).

---

## Paso 11 — Despliegue en Vercel

Cuando hagas deploy, agrega las tres variables en cada proyecto de Vercel:

**Proyecto `merkiai-web` (Vercel):**
```
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID     → prod value
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY → prod value
HEXCLAVE_SECRET_SERVER_KEY          → prod value
```

**Proyecto `merkiai-admin` (Vercel):**
```
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID     → valor del proyecto ADMIN (distinto al de la web)
NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY → valor del proyecto ADMIN
HEXCLAVE_SECRET_SERVER_KEY          → valor del proyecto ADMIN
```

Ver `DEPLOYMENT.md` para el procedimiento completo de despliegue.

---

## Resumen de archivos de integración

| Archivo | Descripción |
|---|---|
| `apps/web/src/stack.ts` | Instancia `StackServerApp` con URLs custom (login → `/login`, registro → `/registro`) |
| `apps/web/src/middleware.ts` | Protege `/mi-cuenta/*`; sin sesión → `/login?returnTo=...` |
| `apps/web/src/app/layout.tsx` | Envuelve la app en `<StackProvider>` + `<StackTheme>` |
| `apps/web/src/app/handler/[...stack]/page.tsx` | Catch-all para flows internos de Stack (password reset, verificación) |
| `apps/web/src/app/(auth)/login/page.tsx` | Formulario de login branded Merkiai |
| `apps/web/src/app/(auth)/registro/page.tsx` | Formulario de registro branded Merkiai |
| `apps/web/src/components/auth/LogoutButton.tsx` | Botón de cierre de sesión (`useUser().signOut()`) |
| `apps/web/src/app/api/auth/welcome/route.ts` | API route que envía email de bienvenida vía Resend tras el registro |
| `apps/admin/src/stack.ts` | Instancia `StackServerApp` para el admin |
| `apps/admin/src/middleware.ts` | Protege todas las rutas del admin; sin sesión → `/handler/sign-in` |
| `apps/admin/src/app/layout.tsx` | `StackProvider` + topbar con nombre real del usuario |
| `apps/admin/src/app/handler/[...stack]/page.tsx` | Catch-all handler para el admin |

---

## Configuración para multi-tenant + Supabase RLS (roadmap E17)

> **Estado:** 🔲 roadmap (HU-171 spike → HU-156). Esta sección documenta la configuración **validada contra la doc oficial** (docs.hexclave.com, ago-2026) que habrá que realizar cuando se adopte la plataforma multi-tienda. **No aplica al modelo single-tenant actual.** El PoC de HU-171 confirma la mecánica antes de implementar.

### Modelo en una línea

**1 Team de Stack Auth = 1 tenant (negocio-cliente).** La identidad y los roles viven en Stack Auth (Teams + RBAC); el **aislamiento de datos** lo garantiza la **RLS de Supabase** con el `tenant_id` viajando en un **JWT firmado**. El `service-role` (que omite RLS) **solo** se usa en el control plane.

### A · Integración Supabase RLS por JWT (patrón oficial) — HU-156/171

Esta es la estrategia **primaria** de aislamiento. Pasos de configuración:

1. **Obtener el secreto JWT de Supabase:** dashboard de Supabase → **Project Settings → API → JWT Settings → `JWT Secret`**. Copiar a las envs como `SUPABASE_JWT_SECRET` (server-only, nunca al cliente).
2. **Server action que emite el JWT** con el claim `tenant_id` (= Team activo, verificando membresía server-side):

   ```ts
   // utils/supabase-jwt.ts  (server action)
   'use server';
   import { hexclaveServerApp } from '@/hexclave/server';
   import * as jose from 'jose';

   export async function getSupabaseJwt(activeTeamId: string) {
     const user = await hexclaveServerApp.getUser();
     if (!user) return null;
     const team = await user.getTeam(activeTeamId); // null si no es miembro
     if (!team) return null; // fail-closed: sin tenant válido, no hay token

     return await new jose.SignJWT({
       sub: user.id,
       role: 'authenticated',
       tenant_id: team.id,           // ← claim que consume la RLS
     })
       .setProtectedHeader({ alg: 'HS256' })
       .setIssuedAt()
       .setExpirationTime('1h')
       .sign(new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!));
   }
   ```

3. **Cliente Supabase con el token** (callback `accessToken`) — usa la **anon key** (rol `authenticated`, sujeto a RLS), **no** el service-role.
4. **Políticas RLS por tenant** que leen el claim:

   ```sql
   -- Ejemplo de policy en una tabla tenant-scoped
   CREATE POLICY "tenant_isolation" ON public.products
     FOR ALL TO authenticated
     USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
   ```

5. **Regla de oro:** el plano de tienda (`apps/web`, `apps/admin`) **nunca** usa el service-role. Fallback GUC (`SET LOCAL app.current_tenant`) + rol dedicado solo para rutas server-only (webhooks/cron/ISR resueltos por host).

> **⚠️ Riesgo a confirmar en el PoC:** el ejemplo oficial usa **HS256 con secreto compartido**; Supabase migra a **llaves asimétricas (ECC/RSA)** — verificar qué firma acepta el proyecto actual y ajustar `alg`/clave. Además, como el token porta el tenant activo, **cambiar de tenant obliga a re-emitir** el JWT.

### B · Teams = tenants — HU-156/172

1. En el dashboard, habilitar **Teams** (app de Teams).
2. **Client-side team creation: OFF.** El alta de tenants es **server-side desde el control plane** (`hexclaveServerApp.createTeam(...)` + `team.addUser(...)`), no desde el cliente.
3. Guardar el mapeo y el plan en la **metadata del Team**: `serverMetadata` (solo servidor) con `{ tenant_id, plan, subscription_status }`.
4. **Sincronizar Team → fila `tenants`** en Supabase vía **webhook** (la integración RLS/JWT **no** sincroniza datos por sí sola). Configurar en **Webhooks** el endpoint del control plane para eventos de Team creado/actualizado/eliminado.

### C · RBAC (roles y permisos) — HU-158/172/173

En el dashboard, app **RBAC**:

1. **Team Permissions** (roles **por tenant**): definir p. ej. `store:admin`, `store:editor`, `store:viewer` (anidables — `store:admin` contiene a los demás). Se asignan a miembros desde la tabla de miembros del Team.
2. **Project Permissions** (globales, cross-team): definir `platform:operate` para el **operador del control plane**. Se otorgan server-side (`user.grantPermission('platform:operate')`).
3. **Verificación siempre server-side** (los checks de cliente se pueden saltar):

   ```ts
   // Rol por tienda
   if (!await user.hasPermission(team, 'store:admin')) return forbidden();
   // Operador de plataforma
   if (!await user.hasPermission('platform:operate')) return forbidden();
   ```

4. Los **entitlements de plan** (HU-173) se derivan del plan del tenant (metadata/`subscriptions`), no de RBAC; RBAC cubre **roles**, no *features* de plan.

### D · Variables de entorno adicionales (multi-tenant)

| Variable | Dónde | Notas |
|---|---|---|
| `SUPABASE_JWT_SECRET` | Supabase → Settings → API → JWT Secret | Server-only. Para firmar el JWT con el claim `tenant_id`. Revisar migración a llaves asimétricas. |

> Las tres variables de Stack Auth (`NEXT_PUBLIC_HEXCLAVE_PROJECT_ID`, `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY`, `HEXCLAVE_SECRET_SERVER_KEY`) siguen igual. El nuevo `apps/console` usa las mismas + el **service-role** de Supabase (única app autorizada a omitir RLS).

### E · Checklist de configuración en el dashboard (cuando se implemente E17)

- [ ] Teams habilitado · client-side creation **OFF**
- [ ] RBAC: Team Permissions (`store:admin/editor/viewer`) + Project Permission (`platform:operate`)
- [ ] Webhook Team→`tenants` apuntando al control plane
- [ ] `SUPABASE_JWT_SECRET` en envs (web, admin, control-plane)
- [ ] Confirmado el algoritmo de firma JWT que acepta el proyecto Supabase (HS256 vs asimétrica)
- [ ] Policies RLS `tenant_id = auth.jwt()->>'tenant_id'` en todas las tablas tenant-scoped
- [ ] Verificado: el plano de tienda no usa service-role (solo el control plane)

---

## Troubleshooting

**"Invalid project ID" al arrancar:**
→ Verifica que `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` esté bien copiado en `.env.local` y que hayas reiniciado el servidor de desarrollo.

**El login redirige a una página en blanco:**
→ Asegúrate de que `http://localhost:3000` esté en la lista de dominios permitidos en el panel de Stack Auth.

**"Unauthorized" al llamar a `/api/auth/welcome`:**
→ El usuario no tiene sesión activa. Esto no debería pasar en flujo normal, pero si ocurre en desarrollo, asegúrate de que la cookie de Stack Auth esté siendo seteada (revisa las DevTools → Application → Cookies).

**El admin siempre redirige a `/handler/sign-in`:**
→ El middleware del admin protege todas las rutas. Inicia sesión primero en `http://localhost:3001/handler/sign-in`. **La cuenta del admin es independiente de la de la web** (proyectos de Stack Auth distintos): debes tener un usuario en el proyecto admin con rol admin en `profiles`.

---

*Merkiai · Parquesoft TI · Agosto 2026 (v2 — añadida configuración multi-tenant + Supabase RLS por JWT, validada contra doc oficial Hexclave)*
