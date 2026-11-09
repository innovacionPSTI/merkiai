# ADR-007 · Configuración de infra por-tenant (consola) y custodia de secretos (Vault)

> **Estado:** Propuesto (nov-2026). **Contexto:** E17 — gestión desde la consola de la infra por tenant + custodia cifrada de secretos. **Relacionado:** HU-361 (env → config en consola), HU-362 (Vault), HU-363 (orquestación), HU-364 (set final de env vars + separación de prod), HU-200 (niveles de aislamiento + connection factory), HU-228 (custodia/rotación de secretos), ADR-001 (auth/RLS), ADR-004 (instancias de integración), ADR-005 (infraestructura).
> **Propósito:** fijar **cómo** se modela y resuelve la configuración de infraestructura por tenant y **cómo** se custodian sus secretos cifrados, sin acoplar el producto a un proveedor de Vault y sin reescribir el *connection factory*. Es el diseño previo a implementar HU-361/362/363.

---

## 1. Decisión (resumen)

1. **Dos planos de configuración, separados por naturaleza.**
   - **Infra por-ambiente** (Supabase compartido, proyectos de Stack, `INTERNAL_API_SECRET`, URLs): **sigue en el gestor de secretos del entorno** (hoy env de Vercel; luego respaldable por Vault). No se mueve a la consola porque no es por-tenant.
   - **Infra por-tenant dedicado** (endpoint/claves de su BD propia, `JWT_SECRET` de esa instancia, DSN de Sentry, base URL): **se gestiona desde la consola** y se guarda en la **BD de plataforma**, con los **secretos cifrados** (nunca en claro).
2. **Modelo en plataforma, indexado por `db_ref`.** Una tabla `tenant_infra_config` (config no secreta) + referencias a material secreto en el **vault**. El *connection factory* (ADR-001/HU-200) arma el `DbTargetRegistry.dedicated` leyendo de ahí, en vez de env.
3. **Custodia vía una abstracción `SecretsVault`** (patrón interfaz+factory+adaptadores, igual que pagos/identidad). **No** se acopla el código a un proveedor concreto: se define el contrato y adaptadores intercambiables. **Adaptador por defecto: AWS KMS (cifrado de sobre), provisionado por AWS CDK, accedido con un IAM de alcance mínimo.**
4. **Descifrado solo server-side, por request, con mínimo privilegio.** Nunca en el cliente, nunca en logs; todo acceso/rotación auditado (HU-146) y alertable (HU-170).
5. **Fail-closed.** Un `db_ref` dedicado sin config/secreto resoluble **lanza** (ya lo hace `resolveDbTarget`); no cae al compartido ni expone otro tenant.

---

## 2. Contexto y costura existente

El *connection factory* ya está preparado (`packages/tenancy/src/factory.ts`):

```ts
interface DbTarget { url: string; anonKey: string }          // hoy
interface DbTargetRegistry { shared: DbTarget; dedicated?: Record<string, DbTarget> }
resolveDbTarget(tenant, registry)   // fail-closed si db_ref no está registrado
```

Hoy `registry.shared` se arma de env y `dedicated` está vacío. **HU-361/362 llenan `dedicated`** desde la plataforma + vault, sin tocar a los consumidores. La config de **negocio** por tenant (pagos/envíos/correo) ya salió de env a BD (`integration_instances`, ADR-004); este ADR hace lo análogo para la **infra** de tenants dedicados.

---

## 3. Modelo de datos (BD de plataforma)

```
tenant_infra_config
  tenant_id        uuid  → tenants(id)         -- 1:1 con el tenant dedicado
  db_ref           text  → clave del DbTarget dedicado (coincide con tenants.db_ref)
  db_url           text                        -- endpoint de su Postgres/Supabase (NO secreto)
  base_url         text  null                  -- base URL de su instancia (si dedicada app-tier)
  sentry_dsn       text  null                  -- DSN de monitoreo (no secreto crítico)
  region           text  null
  -- Referencias a material SECRETO (no el valor): id lógico en el vault
  secret_ref_anon_key      text                -- anon/publishable de su BD
  secret_ref_service_key   text                -- service-role de su BD
  secret_ref_jwt_secret    text                -- JWT secret de esa instancia
  status           text  check (in 'draft','active','rotating','disabled')
  created_at / updated_at
```

- **Los valores secretos NO viven aquí.** La fila guarda solo **referencias** (`secret_ref_*`) que el vault resuelve. La BD de plataforma, si se compromete, no entrega las llaves (HU-362 AC-1).
- RLS: tabla solo del control plane (service-role), como el resto de plataforma.
- `DbTarget` se extiende a `{ url, anonKey, serviceKey, jwtSecret }` (los tres últimos resueltos del vault en memoria).

---

## 4. Custodia de secretos — abstracción `SecretsVault`

```ts
interface SecretsVault {
  get(ref: string): Promise<string>                 // descifra server-side
  put(name: string, value: string): Promise<string> // devuelve el ref
  rotate(ref: string, newValue: string): Promise<void>
  delete(ref: string): Promise<void>
}
```

Adaptadores (se elige por config, no por código de negocio):

| Adaptador | Cuándo | Pros | Contras |
|---|---|---|---|
| **`KmsEnvelopeVault` → AWS KMS (elegido)** | Cifrado de sobre con **AWS KMS**; el ciphertext (DEK cifrada + payload) se guarda en la BD de plataforma | Estándar, rotación de KEK gestionada, sin servicio con estado propio, IAM granular | Requiere cuenta/infra AWS (CDK) |
| **`SupabaseVault`** (interino) | La plataforma ya es Supabase → usa su Vault (pgsodium) | Cero infra nueva, rápido de habilitar | Acopla a Supabase; menos portable |
| **`ExternalVault`** (opcional) | HashiCorp Vault / Infisical / Doppler | Máximo control/rotación centralizada | Operación de un servicio extra |

**Decisión:** adaptador por defecto **`KmsEnvelopeVault` sobre AWS KMS**, con `SupabaseVault` solo como fallback interino de desarrollo. El contrato `SecretsVault` mantiene el código agnóstico (ADR-005); cambiar de proveedor es cambiar el adaptador + re-cifrar, sin tocar el factory ni la consola.

### 4.1 Provisioning (AWS CDK) e IAM de alcance mínimo

La infra de KMS se gestiona **como código con AWS CDK** (no por clic en consola), versionada y reproducible por entorno (test/dev/prod → una KEK por entorno, claves y aliases separados):

- **`kms.Key`** (una KEK por entorno) con **rotación automática anual activada**, `alias/merkiai-<env>-tenant-secrets`, y **key policy** que solo permite usarla al principal de la app (no a toda la cuenta).
- **Cifrado de sobre:** la app pide `GenerateDataKey` (DEK por secreto/tenant), cifra el valor con la DEK en memoria y guarda `{ dek_cifrada, ciphertext }`; para leer, `Decrypt` de la DEK y descifra en memoria. Rotar un tenant = re-`GenerateDataKey` + re-cifrar, sin afectar a otros.
- **IAM de alcance justo** (principio de menor privilegio): un principal con **solo** `kms:GenerateDataKey`, `kms:Decrypt` y `kms:Encrypt` **restringidos al ARN de esa KEK** (nunca `kms:*` ni `Resource: *`), más `kms:DescribeKey` si hace falta. La key policy y la política IAM se definen ambas en el CDK.
- **Credencial:** como las apps corren en Vercel (fuera de AWS), se usa un **usuario IAM dedicado** con esa política mínima; su `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` viven como secretos del entorno (nunca en repo) y se rotan como el resto (HU-228). *A futuro*, si la app corre en cómputo AWS, migrar a **rol IAM vía OIDC** (sin llaves estáticas) es un cambio de credencial, no de código.
- **Separación por entorno:** KEK, alias y usuario IAM distintos por test/dev/prod → una llave de no-prod no puede descifrar secretos de prod.

---

## 5. Resolución en runtime

1. El request resuelve el tenant (host → `tenants` → `db_ref`).
2. Si `db_ref` es `null`/`shared` → `DbTarget` compartido desde env (sin cambios).
3. Si es dedicado → lee `tenant_infra_config`, descifra `secret_ref_*` vía `SecretsVault.get` **en memoria**, arma el `DbTarget` y lo **cachea por instancia/TTL corto**. Nunca se serializa al cliente ni se loguea.
4. `resolveDbTarget` sigue **fail-closed**: sin config/secreto → lanza.

Separación de privilegios (recoge HU-228 pendiente): el secreto de aprovisionamiento consola↔admin pasa a **`PROVISIONING_API_SECRET`** propio, distinto del de resolución de tenant.

---

## 6. Fases de implementación

- **Fase 0 — este ADR.** Decisión + contratos (`SecretsVault`, extensión de `DbTarget`). Sin cambios de runtime.
- **Fase 1 — HU-361.** Tabla `tenant_infra_config` (config **no** secreta) + UI en consola + el factory lee la parte no secreta. Secretos aún mínimos/manuales.
- **Fase 2 — HU-362.** `SecretsVault` + adaptador por defecto + cifrado en reposo + rotación por-tenant + auditoría/alerta. El factory resuelve secretos vía vault.
- **Fase 3 — HU-363.** Orquestador "promover a dedicado" que compone HU-200 (migración de datos) + 361 (config) + 362 (secretos), idempotente y con rollback.
- **Transversal — HU-364.** Tras 361/362: congelar el set de env vars, retirar las migradas, renombrar `CONTROL_PLANE_URL → CONSOLE_URL` y formalizar la separación de producción.

---

## 7. Alternativas consideradas

- **Guardar secretos cifrados en la misma fila (sin vault/KMS).** Rechazada: un dump de la BD de plataforma + la llave (si está cerca) entrega todo; no cumple HU-362 AC-1/AC-2.
- **Todo en env de Vercel, también lo dedicado.** Rechazada: no escala por-tenant, no permite rotación por-tenant ni gestión desde la consola; es justo lo que HU-361 elimina.
- **Acoplar a Supabase Vault directamente.** Rechazada como destino final (va contra ADR-005); se admite solo como adaptador interino detrás de la interfaz.

---

## 8. Consecuencias

- **Positivas:** config de infra por-tenant gestionable desde la consola; secretos cifrados en reposo con rotación por-tenant; factory intacto para los consumidores; proveedor de vault intercambiable; auditoría/alerta reutilizando HU-146/170.
- **A vigilar:** el descifrado por request añade latencia → mitigar con caché por instancia + TTL corto; la rotación de un tenant no debe afectar a otros (claves por-tenant); el adaptador por defecto requiere provisionar un KMS antes de producción dedicada.
- **Alcance de la reducción de env vars:** **solo** migran las de **infra por-tenant dedicado**; las de **infra por-ambiente** permanecen (podrán respaldarse por vault, pero siguen siendo por-entorno). La matriz `docs/ENV-VARS-MATRIZ.md` se congela en HU-364.

## 9. Secretos de plataforma por-entorno en el vault

Además de los secretos **por-tenant** (§3-§5), el vault (`SecretsVault`, §4) custodia los **secretos de plataforma por-entorno** que hoy viven como env: en particular **`HOSTING_API_TOKEN`** (token de Vercel que registra dominios y gestiona proyectos — es sensible) y las **llaves del usuario IAM de AWS** (`AWS_SECRET_ACCESS_KEY`). Siguen siendo **por-entorno** (una por test/dev/prod), no por-tenant, pero se guardan cifradas y se rotan por el mismo procedimiento (HU-228/362), no en texto plano en env.

No son secretos y **permanecen como config plana** (env o tabla): `HOSTING_PROJECT_ID`, `HOSTING_TEAM_ID`, `HOSTING_A_RECORD`, `HOSTING_CNAME_TARGET` (identificadores y destinos DNS públicos). El retiro de `HOSTING_API_TOKEN` de env hacia el vault se ejecuta en HU-362 y se refleja en la matriz al congelarla (HU-364).
