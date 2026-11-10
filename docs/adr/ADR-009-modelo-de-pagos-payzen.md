# ADR-009 · Modelo de pagos con PayZen/Lyra (billing SaaS y ventas del tenant)

> **Estado:** Propuesto (nov-2026). **Contexto:** integración de **PayZen/Lyra** (gateway, PCI-DSS + antifraude) acordada en la reunión con Lyra; oferta comercial en `Reunion Lyra/`. **Relacionado:** E17 billing (HU-192/193/194 `BillingProvider`), registry de pagos por tenant (ADR-004 · HU-275–277), modelo de costos (`MODELO-COSTOS-MERKIAI.md`).
> **Propósito:** fijar **cómo** se usa PayZen en los dos frentes —cobro de los **planes SaaS** y **ventas de cada tenant**— y **qué modelo comercial** se adopta para las ventas (reventa/gateway vs agregador), para monetizar transacciones sin asumir cargas regulatorias antes de validarlas.

---

## 1. Decisión (resumen)

1. **Dos usos separados de PayZen:**
   - **Uso 1 — Billing SaaS:** Merkiai cobra los planes (mensual/anual) a sus tenants con **cobro recurrente por tokenización**, desde **su propia tienda PayZen**. Entra en el `BillingProvider` (E17).
   - **Uso 2 — Ventas del tenant:** PayZen como medio de pago para que cada tienda reciba sus ventas, dentro del **registry de proveedores por tenant** (ADR-004).
2. **Para las ventas del tenant (Uso 2) hay tres modelos; se lanza con 1+2 y se difiere el 3:**
   - **Modelo A — BYO (trae tu pasarela):** el tenant usa su propia cuenta (Wompi/MercadoPago/PayZen). Merkiai no toca fondos ni cobra por transacción; solo la suscripción. *Barato para tiendas pequeñas* (Wompi/MP son % sin mensualidad).
   - **Modelo B — "Merkiai Pagos" (reventa de PayZen, SIN custodia):** Merkiai es titular de la **cuenta PayZen multitienda**; cada tenant es una **tienda PayZen con su propia cuenta bancaria de destino** (el dinero va **directo** al tenant — es gateway, no agregación). PayZen factura a Merkiai ~$380–410 COP/tx; Merkiai le cobra **más** al tenant (markup) y se queda el margen. **Legalmente limpio.**
   - **Modelo C — Agregador (tipo Shopify Payments), DIFERIDO:** Merkiai *merchant of record*: todo el dinero cae en cuentas de Merkiai, cobra tarifas de mercado y **dispersa a cada cliente con el módulo SEN** desde el Console. **Requiere figura jurídica** (entidad de pago/SEDPE o aliado licenciado), custodia/float, conciliación, contracargos y retenciones. **No en la ruta crítica**: se construye tras **validación legal/financiera**.
3. **Tarifa al tenant (Uso 2, Modelo B):** un **% (y fijo opcional) configurable** — no cableado —, ajustable **por plan y/o por tenant** desde la consola (ej. ~2.9% + fijo tipo mercado). Como el costo de PayZen es **fijo por transacción**, el margen crece con el ticket. El parámetro ya es una entrada editable en la calculadora (`CALCULADORA-COSTOS-MERKIAI.xlsx`, hoja Pagos).
4. **Segmentación por tamaño de tienda:**
   - **Tiendas pequeñas → Modelo A** (Wompi/MercadoPago, **% sin mensualidad**), porque el Modelo B carga el piso mensual de la tienda PayZen (~$120k COP). El Modelo B se reserva para **volumen medio/alto**.
   - **Si se concreta el Modelo C** (agregador, validado jurídicamente), **las tiendas pequeñas migran a C**: ahí está su mayor valor, porque **una sola tienda PayZen consolidada elimina el piso mensual por tienda** y habilita "pagos nativos" para todos, incluidos los pequeños.
5. **Sin custodia de fondos en A y B** (evita regulación de manejo de dinero de terceros). El Modelo C es el único que la asume y por eso se separa.

---

## 2. Datos de la oferta que condicionan el modelo

- **Suscripción mensual de PayZen es POR TIENDA** (Premium $120.000 / Expert $285.000 COP) → si **cada tenant = una tienda PayZen**, hay un **piso de ~$120k COP/mes por tenant**. Por eso el Modelo B solo conviene para tenants de **volumen medio/alto**; los pequeños van en Modelo A (Wompi/MP, % sin mensualidad).
- **Costo por transacción plano** (~$380–410 COP, sin importar el ticket) → cobrar al tenant un **%** deja margen creciente con el ticket.
- **Tokenización ilimitada: $120k COP/mes** — **costo fijo de plataforma** para el billing recurrente (Uso 1).
- El **Modelo C consolida** el fijo mensual en **una sola tienda PayZen** (barato por tenant a escala), que es su principal atractivo económico — pero a cambio de la carga regulatoria.

---

## 3. Encaje con la arquitectura

- **Uso 1 (billing)** → adaptador **`BillingProvider` PayZen**: tokeniza el medio de pago del tenant, crea la **regla de recurrencia**, procesa **webhooks IPN** (pagado/pendiente/rechazado/recurrente) y gobierna el ciclo `active/past_due/suspended` + correos (activación, recibo, aviso de impago) + suspensión/reactivación.
- **Uso 2 (ventas)** → adaptador **PayZen en el registry** (ADR-004): instancia por tenant con su tienda PayZen (código de servicio/terminal/cuenta). "Merkiai Pagos" (Modelo B) es una instancia gestionada por el operador con markup; BYO (Modelo A) es la instancia del propio tenant.
- **Idempotencia** de webhooks reutiliza los patrones existentes (HU-162/298).

---

## 4. Alternativas / lo que se descarta ahora

- **Agregador desde el día 1 (Modelo C):** descartado para el launch — es un proyecto legal/financiero, no técnico; se madura aparte.
- **Cada tenant con tienda PayZen propia como default:** descartado como regla general por el piso de $120k/mes; se reserva para tenants con volumen.

---

## 5. Consecuencias

- **Positivas:** se monetizan transacciones (Modelo B) **sin volverse agregador**; se reúsa el registry (Uso 2) y el `BillingProvider` (Uso 1); el adaptador PayZen se construye contra la doc (REST V4.0 + tokenización `token_network` + IPN) **sin esperar llaves de producción** (hay entorno de pruebas).
- **A vigilar:** el **piso mensual por tienda** de PayZen → segmentar por volumen qué tenant va en Modelo A vs B; el **Modelo C** queda bloqueado por la validación jurídica; sumar el **fijo de tokenización ($120k/mes)** al modelo de costos.
- **Costos/precios:** el markup por transacción (Modelo B) es un **ingreso** adicional al de suscripción; se refleja en `MODELO-COSTOS-MERKIAI.md` y la calculadora.
