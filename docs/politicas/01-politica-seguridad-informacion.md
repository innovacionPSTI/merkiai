# 01 · Política de seguridad de la información

| Versión | Fecha | Aprobó | Cambio |
|---|---|---|---|
| 1.0 (borrador) | nov-2026 | _pendiente_ | Versión inicial |

## 1. Propósito y alcance

Proteger la **confidencialidad, integridad y disponibilidad** de la información de Merkiai, de las
tiendas que la usan (tenants) y de los compradores de esas tiendas. Aplica a la plataforma SaaS
(apps `web`, `admin`, `console`, APIs, bases de datos, infraestructura en la nube y repositorio de
código), a su operación y a todo el personal y contratistas con acceso.

## 2. Compromisos de la dirección

- Cumplir los requisitos legales y contractuales aplicables, en particular la **Ley 1581 de 2012**
  (protección de datos personales, Colombia) y los requisitos de las pasarelas de pago (PCI DSS:
  Merkiai **no almacena ni procesa datos de tarjeta**; los tokeniza la pasarela).
- Asignar recursos y responsables para mantener y mejorar el sistema de gestión de seguridad.
- Revisar anualmente esta política, los riesgos y los resultados de los controles.

## 3. Principios

1. **Aislamiento por tenant:** los datos de una tienda nunca deben ser accesibles por otra. Se
   aplica en la base de datos (RLS) y en el almacenamiento, no solo en la aplicación.
2. **Mínimo privilegio:** cada persona, servicio y llave tiene solo los permisos que necesita.
3. **Secretos fuera del código:** credenciales en el vault (AWS KMS) o variables de entorno del
   proveedor; nunca en el repositorio, en la interfaz ni en registros.
4. **Seguro por defecto y fail-closed:** si falta una configuración crítica, el sistema niega en vez
   de abrir.
5. **Defensa en profundidad:** varias capas (autenticación, autorización, RLS, CSP, CSRF, auditoría).
6. **Trazabilidad:** las operaciones sensibles y de dinero dejan registro de quién, qué y cuándo.
7. **Separación de ambientes:** producción separada de desarrollo y pruebas (cuentas, llaves, datos).

## 4. Políticas específicas

Esta política se desarrolla en: control de acceso (02), cambios y desarrollo seguro (03), respuesta a
incidentes (04), continuidad y respaldos (05), proveedores (06), riesgos (07) y clasificación de
datos (08).

## 5. Uso aceptable (personal y contratistas)

- Usar MFA en todas las cuentas de trabajo (correo, GitHub, Vercel, Supabase, AWS, Stack Auth).
- Equipos con disco cifrado, bloqueo de pantalla y sistema operativo actualizado.
- No copiar datos de producción a equipos personales ni a ambientes de prueba.
- No compartir cuentas ni credenciales. Reportar de inmediato la pérdida de un equipo o la sospecha
  de un incidente.
- Acceder a datos de una tienda solo para soporte solicitado o por obligación operativa, dejando
  registro.

## 6. Concienciación

Inducción en seguridad al ingresar y capacitación anual (phishing, manejo de datos, reporte de
incidentes), con constancia de asistencia.

## 7. Incumplimiento

El incumplimiento se trata según el reglamento interno y los contratos; puede implicar la retirada
inmediata de accesos.
