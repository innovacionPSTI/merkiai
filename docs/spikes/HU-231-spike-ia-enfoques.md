# HU-231 · Spike — Enfoques de IA para Merkiai (API directa vs. servicios gestionados vs. propio/custom)

> **Tipo:** Spike (investigación time-boxed, ~3–5 días). **Épica:** E16 (IA) · toca E17 (planes/entitlements).
> **Estado:** 🔲 Investigación. **No produce código de producción**, sino una decisión (ADR) que guía HU-135/137/222/223/224 y el cobro del feature IA (HU-225).

## 1. Pregunta del spike

¿Qué combinación de **modelo + plataforma de servicio + grado de personalización** conviene a Merkiai para cada capacidad de IA, considerando que es un **SaaS multi-tenant** (aislamiento de datos por tenant, costo atribuible por plan, guardrails)? En concreto: **API directa de modelos** vs. **servicio gestionado (AWS Bedrock / Vertex)** vs. **desarrollo propio / self-host** vs. **modelos a la medida (fine-tuning/LoRA)** — y cuándo cada uno.

## 2. Enfoques evaluados

**A · API directa de modelos** (Anthropic, OpenAI, etc.). Se llama al endpoint del proveedor.
- **A favor:** acceso día-uno a modelos y features nuevas (extended thinking, structured outputs, computer use), facturación simple, menor latencia, cero infraestructura.
- **En contra:** un solo proveedor por integración (mitigable con abstracción), sin residencia de datos/VPC nativa, gobierno de datos delegado al proveedor.

**B · Servicio gestionado (AWS Bedrock, Google Vertex).** El mismo modelo (p. ej. Claude) servido tras la nube del hyperscaler.
- **A favor:** IAM/VPC PrivateLink, **residencia de datos regional**, BAA incluido, **factura única** del cloud, descuentos por compromiso de uso, procura por marketplace. Precio por token **a la par** de la API directa en regiones estándar.
- **En contra:** **+50–150 ms de latencia** por la capa proxy; los modelos/features nuevas llegan **después**; costos adyacentes (Knowledge Bases, Agents, Guardrails, transferencia de datos, variaciones regionales) que la API directa no tiene. A gran volumen (>~3M tokens/mes) el tier provisionado puede salir ~7% más barato.

**C · Desarrollo propio / self-host** (modelos abiertos —Llama, Mistral, etc.— en infraestructura propia/GPU).
- **A favor:** control total, sin costo por token (sí por GPU/hora), datos nunca salen de tu infraestructura, personalización profunda.
- **En contra:** costo fijo alto, MLOps/SRE dedicados, calidad frontier inferior a los modelos cerrados top, y **~6× el costo de inferencia** de un modelo fine-tuned vs. prompting. Solo rentable **a gran escala y con equipo**.

**D · Modelos a la medida (fine-tuning / LoRA + RAG).**
- Regla 2026: **fine-tuning es para _forma_, no para _hechos_** — moldea estilo, tono de marca, salida estructurada y patrones de rechazo; **no** para inyectar conocimiento que cambia seguido (eso es RAG). El mejor ROI es un **adaptador LoRA/QLoRA delgado sobre un base fuerte, combinado con RAG**, no reemplazándolo.

## 3. Marco de decisión (secuencia canónica 2026)

> **Prompt → RAG → Fine-tune → Distill/Self-host.** Empezar por lo barato y escalar solo con evidencia.

1. **Prompt engineering** resuelve ~70% de los problemas de comportamiento (horas/días). Techo real, pero es el default.
2. **RAG** cuando se necesita **dato en tiempo real / propio** (catálogo, inventario, contenido del tenant). Default de producción = **prompt + RAG**.
3. **Fine-tune (LoRA)** solo cuando hay evidencia de un problema que prompt+RAG no cierran: deriva de esquema, inconsistencia de tono, errores de formato, la cola larga que el prompt no lleva al 100%.
4. **Distill / self-host** solo a escala con volumen y equipo que lo justifiquen.

## 4. Matriz por capacidad de Merkiai

| Capacidad (HU) | Enfoque recomendado | Plataforma | Personalización |
|---|---|---|---|
| **Generación de diseño "vestir la web"** (HU-224) · copy por bloque (HU-223) | Prompt + **salida estructurada** al `blockSchemas` (HU-222) | API directa | Prompt; fine-tune LoRA solo si el JSON/tono derivan a escala |
| **Apariencia por chat** (HU-143) | Prompt → cambios de theme validados contra esquema | API directa | Prompt |
| **Asistente de compra** (HU-138) · **búsqueda semántica** | **RAG** sobre catálogo del tenant | API directa + **vector store** (HU-137) | RAG (nada de fine-tune) |
| **Recomendaciones/clustering** (HU-140/141/142) | Embeddings + heurística/ML clásico | API directa (embeddings) | Modelo propio ligero posible |
| **Búsqueda visual** (HU-139) · **generación de imágenes** (HU-144) | Modelo multimodal/imagen | API directa (o Bedrock si el cliente exige residencia) | Prompt |
| **Detección de fraude** (HU-145) | ML clásico + señales; LLM auxiliar | Propio + API directa | Modelo propio a la medida |

## 5. Recomendación para Merkiai

1. **Arquitectura: abstracción de proveedor de IA (HU-135) primero.** Un `AIProvider` intercambiable (igual que Payment/Email/Storage) desacopla el modelo/plataforma del resto. Permite empezar con **API directa** y cambiar a **Bedrock/Vertex por tenant o por plan** sin tocar features.
2. **Default: API directa + prompt + RAG.** Es el camino de menor costo/latencia y el que da acceso a las features nuevas (structured outputs = base de HU-222). RAG con `vector store` (HU-137) para catálogo/contenido, **acotado por `tenant_id`** (aislamiento en el retrieval, igual que la RLS).
3. **Bedrock/Vertex como opción _por plan_ (el tipo de storage/IA afecta el plan).** Reservado a clientes enterprise que exigen **residencia de datos, VPC/PrivateLink, BAA o compra por marketplace**. El `AIProvider` lo selecciona por entitlement — mismo patrón que `StorageProvider` (HU-230).
4. **Fine-tuning (LoRA) solo para _forma_ y solo con evidencia:** si la salida estructurada de HU-224 (JSON de `blockSchemas`) o el tono de marca derivan pese a prompt+validación, un adaptador delgado sobre el base + RAG. **No** para conocimiento del catálogo.
5. **Self-host: no ahora.** Solo si el volumen agregado justifica GPUs dedicadas y hay equipo MLOps.
6. **Guardrails multi-tenant (transversal):** toda salida IA pasa por **validación estructurada + sanitización fail-closed** (HU-222) antes de aplicarse; **medición/cupos por plan** (HU-225); prompts/RAG **nunca** mezclan datos entre tenants.

## 6. Criterios de salida del spike (Definition of Done)

- ADR publicado (`docs/adr/`) con la decisión "API directa + RAG detrás de `AIProvider`, Bedrock por plan, fine-tune diferido".
- PoC mínimo: una llamada de **generación estructurada** (copy de un bloque) validada contra `blockSchemas` (enlaza HU-222/223).
- Estimación de **costo por generación** y su mapeo a **cupos por plan** (HU-225).
- Lista de señales que dispararían fine-tuning o Bedrock (umbral de volumen, requisito de residencia).

## 7. Referencias

- CloudZero — Amazon Bedrock pricing 2026: https://www.cloudzero.com/blog/amazon-bedrock-pricing/
- CloudZero — Claude on AWS: Bedrock vs Claude Platform (2026): https://www.cloudzero.com/blog/claude-on-aws-bedrock/
- Respan — Anthropic API vs AWS Bedrock Claude (2026): https://www.respan.ai/articles/claude-vs-bedrock-claude
- Spheron — AWS Bedrock vs Self-Hosted LLMs (2026): https://www.spheron.network/blog/aws-bedrock-pricing-2026-managed-api-cost/
- Winder.ai — RAG vs Fine-Tuning 2026 decision framework: https://winder.ai/rag-vs-fine-tuning-2026-decision-framework/
- BigDataBoutique — Fine-tuning when RAG isn't enough: https://bigdataboutique.com/blog/fine-tuning-llms-when-rag-isnt-enough
