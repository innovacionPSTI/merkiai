const stub = function jestEsmStub() {}
stub.prototype = Object.create(Error.prototype)
module.exports = new Proxy(
  { __esModule: true },
  { get(target, prop) { if (prop === '__esModule') return true; return stub } },
)
