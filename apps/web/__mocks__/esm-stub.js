/**
 * Stub CJS genérico para dependencias distribuidas solo como ESM.
 *
 * El proyecto no tiene babel-jest, así que Jest no transforma paquetes ESM de
 * node_modules (jose, export-to-csv, etc.) y falla al cargarlos con
 * "SyntaxError: Unexpected token 'export'". Estos paquetes entran
 * transitivamente (p. ej. vía @stackframe/stack) y en los tests nunca se
 * ejecutan de verdad: solo necesitan cargarse sin romper.
 *
 * El Proxy devuelve un stub invocable / construible / extensible para cualquier
 * named export, cubriendo también subpaths (p. ej. `jose/errors`).
 */
const stub = function jestEsmStub() {}
stub.prototype = Object.create(Error.prototype)

module.exports = new Proxy(
  { __esModule: true },
  {
    get(target, prop) {
      if (prop === '__esModule') return true
      return stub
    },
  },
)
