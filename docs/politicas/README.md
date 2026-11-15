# Políticas de seguridad de la información — Merkiai

> **Estado: BORRADOR v1 (nov-2026) para aprobación de la dirección.** Estas políticas son la base
> documental que piden SOC 2 (CC1–CC9) e ISO/IEC 27001:2022 (cláusulas 5–10 y Anexo A). Se
> redactaron a partir de los controles que **ya existen** en la plataforma
> (`docs/SEGURIDAD-CUMPLIMIENTO.md`), para que lo escrito coincida con lo que se hace.
> Un auditor revisará la **evidencia de operación** (registros, actas, tickets), no solo el texto.

| # | Documento | Marco principal | Dueño | Revisión |
|---|---|---|---|---|
| 01 | [Política de seguridad de la información](01-politica-seguridad-informacion.md) | ISO 5.2, A.5.1 · SOC 2 CC1, CC2 | Dirección | Anual |
| 02 | [Control de acceso](02-control-acceso.md) | ISO A.5.15–A.5.18, A.8.2, A.8.5 · CC6.1–CC6.3 | Resp. de Seguridad | Anual + revisiones trimestrales |
| 03 | [Gestión de cambios y desarrollo seguro](03-cambios-desarrollo-seguro.md) | ISO A.8.25–A.8.32 · CC8.1 · NIST SSDF | Líder técnico | Anual |
| 04 | [Respuesta a incidentes](04-respuesta-incidentes.md) | ISO A.5.24–A.5.28 · CC7.3–CC7.5 | Resp. de Seguridad | Anual + ejercicio |
| 05 | [Continuidad, respaldos y recuperación](05-continuidad-respaldos.md) | ISO A.5.29–A.5.30, A.8.13–A.8.14 · A1.2–A1.3 | Líder técnico | Anual + prueba semestral |
| 06 | [Gestión de proveedores](06-proveedores.md) | ISO A.5.19–A.5.22 · CC9.2 | Resp. de Seguridad | Anual |
| 07 | [Registro de riesgos](07-registro-riesgos.md) | ISO 6.1.2, 8.2 · CC3 | Resp. de Seguridad | Trimestral |
| 08 | [Clasificación y manejo de datos](08-clasificacion-datos.md) | ISO A.5.12–A.5.14, A.5.34, A.8.10–A.8.12 · C1, P | Resp. de Seguridad | Anual |

## Roles

- **Dirección (ParqueSoft TI):** aprueba políticas, acepta riesgos residuales y asigna recursos.
- **Responsable de Seguridad de la Información:** mantiene estas políticas, el registro de riesgos,
  las revisiones de acceso y coordina incidentes. Puede ser la misma persona que el líder técnico
  mientras el equipo sea pequeño, siempre que la dirección revise sus decisiones.
- **Líder técnico:** dueño de la plataforma, de los cambios y de la continuidad operativa.
- **Personal y contratistas:** cumplen estas políticas y reportan incidentes.

## Ciclo de vida

1. La dirección aprueba la versión y se registra en la tabla de control de cada documento.
2. Se comunica al personal (constancia de lectura).
3. Se revisa al menos una vez al año o ante un cambio importante (nuevo producto, incidente grave,
   nueva regulación). Cada revisión queda en el historial del repositorio (git).

## Próximos pasos para auditoría

- **ISO 27001:** definir el alcance del SGSI (sugerido: "plataforma SaaS Merkiai y su operación"),
  la Declaración de Aplicabilidad (SoA) a partir de `SEGURIDAD-CUMPLIMIENTO.md` §2 y una auditoría
  interna antes de la de certificación.
- **SOC 2:** empezar con un **Tipo I** (diseño de controles a una fecha) y luego un **Tipo II**
  (operación durante 3–12 meses). Herramientas de cumplimiento continuo (Vanta, Drata, Secureframe)
  reducen mucho el trabajo de recolección de evidencia.
