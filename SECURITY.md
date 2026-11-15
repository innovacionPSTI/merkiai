# Política de seguridad — Merkiai

## Reportar una vulnerabilidad

Si encuentras una vulnerabilidad en Merkiai, **no abras un issue público**. Escríbenos a
**seguridad@merkiai.com** con:

- descripción del problema y su impacto,
- pasos para reproducirlo (URL, petición, datos de prueba),
- tu contacto para el seguimiento.

Compromisos: acuse de recibo en **2 días hábiles**, evaluación inicial en **5 días hábiles** y
actualización del estado al menos cada **10 días** hasta la corrección. No emprenderemos acciones
contra investigaciones de buena fe que respeten esta política (sin acceso a datos de terceros,
sin degradar el servicio, sin ingeniería social).

## Alcance

Aplicaciones `web` (tiendas), `admin` (panel), `console` (plano de control) y sus APIs.
Fuera de alcance: proveedores externos (Supabase, Vercel, Stack Auth, pasarelas de pago),
ataques de denegación de servicio y hallazgos sin impacto demostrable.

## Versiones soportadas

Se corrige siempre la rama `main` (producción). Los ambientes `develop` y `test` reciben las
correcciones por el flujo normal de promoción.

Controles y evidencias de seguridad: `docs/SEGURIDAD-CUMPLIMIENTO.md`.
