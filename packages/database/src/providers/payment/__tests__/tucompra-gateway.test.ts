/**
 * Unit tests — TuCompraGateway (modalidad INTEGRADOR · API REST, token JWT)
 *
 * Cubre: autenticación (/autenticar), transacción integrador
 * (/confirmacionTransaccionMedioPago con Referencia + MetodoPago → urlBanco),
 * consulta de estado, mapStatus y extractWebhookData. Se mockea global.fetch.
 */

import { TuCompraGateway } from '../TuCompraGateway'
import type { TuCompraTxnParams, TuCompraMetodoPago } from '../TuCompraGateway'

const cfg = {
  usuario: 'user1',
  clave: 'pass1',
  terminal: 'TERM-9',
  apiUrl: 'https://ws.tucompra.net/tcWSDRest/api',
}

const txn: TuCompraTxnParams = {
  referencia: 'ORD-0042',
  valorTotal: 98000,
  descripcion: 'Pedido ORD-0042',
  correo: 'juan@example.com',
  nombre: 'Juan',
  apellido: 'Pérez',
  celular: '3001234567',
  ciudad: 'Bogotá',
  pais: 'CO',
}

// PSE: id + banco (campo1) + tipo persona (campo3) + url retorno (campo4)
const pse: TuCompraMetodoPago = { id: 'PSE', campo1: '1022', campo3: '0', campo4: 'https://shop.com/checkout/confirmation?order=ORD-0042' }

function mockFetchSequence(responses: Array<{ ok?: boolean; json: unknown }>) {
  const fn = jest.fn()
  for (const r of responses) fn.mockResolvedValueOnce({ ok: r.ok ?? true, json: async () => r.json, text: async () => '' })
  global.fetch = fn as unknown as typeof fetch
  return fn
}

afterEach(() => { jest.restoreAllMocks(); (global as { fetch?: unknown }).fetch = undefined })

describe('TuCompraGateway — createIntegradorTransaction', () => {
  it('autentica y crea la transacción, devolviendo urlBanco y CodigoSeguimiento', async () => {
    const fetchMock = mockFetchSequence([
      { json: { codigoRespuesta: '0', tokenSeguridad: 'JWT-123' } },
      { json: { CodigoRespuesta: '2', estado: 'PENDIENTE', CodigoSeguimiento: 'CS-1', urlBanco: 'https://banco/pse/xyz', numeroTransaccion: 'TX-1' } },
    ])

    const r = await new TuCompraGateway(cfg).createIntegradorTransaction(txn, pse)
    expect(r.urlBanco).toBe('https://banco/pse/xyz')
    expect(r.codigoSeguimiento).toBe('CS-1')
    expect(r.codigoRespuesta).toBe('2')

    // 1ª: autenticar
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://ws.tucompra.net/tcWSDRest/api/autenticar')
    // 2ª: confirmacionTransaccionMedioPago con Referencia + MetodoPago + token
    const [url, init] = fetchMock.mock.calls[1]
    expect(String(url)).toBe('https://ws.tucompra.net/tcWSDRest/api/confirmacionTransaccionMedioPago')
    const body = JSON.parse(String(init.body))
    expect(body.Referencia).toBe('ORD-0042')       // correlación del pedido
    expect(body.Valortotal).toBe('98000')          // entero, sin decimales
    expect(body.MetodoPago.id).toBe('PSE')
    expect(body.MetodoPago.campo1).toBe('1022')    // banco
    expect(body.Terminal).toBe('TERM-9')
    expect(body.tokenSeguridad).toBe('JWT-123')
  })

  it('lanza si la autenticación es rechazada', async () => {
    mockFetchSequence([{ json: { codigoRespuesta: '1', mensaje: 'Error auth' } }])
    await expect(new TuCompraGateway(cfg).createIntegradorTransaction(txn, pse)).rejects.toThrow(/autenticación rechazada/i)
  })

  it('createPaymentUrl lanza (integrador requiere método)', async () => {
    await expect(
      new TuCompraGateway(cfg).createPaymentUrl({ orderNumber: 'ORD-1', amountInCents: 100000, currency: 'COP', customerEmail: 'a@b.co', customerName: 'A', redirectUrl: 'x', webhookUrl: 'y', items: [] }),
    ).rejects.toThrow(/seleccionar el medio/i)
  })
})

describe('TuCompraGateway — listarBancos', () => {
  it('devuelve la lista de bancos PSE (POST idMetodoPago/terminal/accessToken → [{codigoBanco,nombreBanco}])', async () => {
    const fetchMock = mockFetchSequence([
      { json: { codigoRespuesta: '0', tokenSeguridad: 'JWT-123' } },
      { json: [{ codigoBanco: '1022', nombreBanco: 'Banco Test' }, { codigoBanco: '1007', nombreBanco: 'Bancolombia' }] },
    ])
    const banks = await new TuCompraGateway(cfg).listarBancos('41')
    expect(banks).toEqual([{ codigo: '1022', nombre: 'Banco Test' }, { codigo: '1007', nombre: 'Bancolombia' }])
    const body = JSON.parse(String(fetchMock.mock.calls[1][1].body))
    expect(body).toEqual({ idMetodoPago: '41', terminal: 'TERM-9', accessToken: 'JWT-123' })
  })
})

describe('TuCompraGateway — constructores de MetodoPago', () => {
  it('metodoPSE arma id + banco (código y nombre) + tipo persona + url retorno', () => {
    expect(TuCompraGateway.metodoPSE('41', '1022', 'Banco Test', '0', 'https://shop/ret'))
      .toEqual({ id: '41', campo1: '1022', campo2: 'Banco Test', campo3: '0', campo4: 'https://shop/ret' })
  })
  it('metodoSimple solo el id (Referenciado/Billetera)', () => {
    expect(TuCompraGateway.metodoSimple('72')).toEqual({ id: '72' })
  })
})

describe('TuCompraGateway — finalizarPagoDaviplata (OTP)', () => {
  it('autentica y confirma el pago con el OTP', async () => {
    const fetchMock = mockFetchSequence([
      { json: { codigoRespuesta: '0', tokenSeguridad: 'JWT-123' } },
      { json: { CodigoRespuesta: '0', estado: 'OK', numeroAutorizacion: 'AUT-9', numeroTransaccion: 'TX-7' } },
    ])
    const r = await new TuCompraGateway(cfg).finalizarPagoDaviplata('SEG-55', '123456')
    expect(r.codigoRespuesta).toBe('0')
    const body = JSON.parse(String(fetchMock.mock.calls[1][1].body))
    expect(body).toEqual({ codigoSeguimiento: 'SEG-55', terminal: 'TERM-9', tokenSeguridad: 'JWT-123', codigoOTP: '123456' })
    expect(String(fetchMock.mock.calls[1][0])).toContain('/finalizaPagoDaviplata')
  })
})

describe('TuCompraGateway — verifyConfirmationSignature', () => {
  const key = 'llave-md5'
  // MD5("llave-md5;ORD-1;1000;AUT-9")
  const crypto = require('crypto') as typeof import('crypto')
  const firma = crypto.createHash('md5').update(`${key};ORD-1;1000;AUT-9`).digest('hex')

  it('valida la firma correcta (case-insensitive)', () => {
    const gw = new TuCompraGateway({ ...cfg, encryptionKey: key })
    expect(gw.verifyConfirmationSignature({ codigoFactura: 'ORD-1', valorFactura: '1000', codigoAutorizacion: 'AUT-9', firmaTuCompra: firma.toUpperCase() })).toBe(true)
  })
  it('rechaza una firma incorrecta', () => {
    const gw = new TuCompraGateway({ ...cfg, encryptionKey: key })
    expect(gw.verifyConfirmationSignature({ codigoFactura: 'ORD-1', valorFactura: '1000', codigoAutorizacion: 'AUT-9', firmaTuCompra: 'deadbeef' })).toBe(false)
  })
  it('devuelve null si no hay llave o no llega firma', () => {
    expect(new TuCompraGateway(cfg).verifyConfirmationSignature({ codigoFactura: 'ORD-1', valorFactura: '1000', codigoAutorizacion: 'AUT-9', firmaTuCompra: firma })).toBeNull()
    const gw = new TuCompraGateway({ ...cfg, encryptionKey: key })
    expect(gw.verifyConfirmationSignature({ codigoFactura: 'ORD-1', valorFactura: '1000', codigoAutorizacion: 'AUT-9', firmaTuCompra: '' })).toBeNull()
  })
})

describe('TuCompraGateway — queryStatusByReference', () => {
  it('devuelve approved cuando estadoPago indica aprobación', async () => {
    mockFetchSequence([
      { json: { codigoRespuesta: '0', tokenSeguridad: 'JWT-123' } },
      { json: { codigoRespuesta: '0', estadoPago: 'APROBADA', numeroTransaccion: 'TX-1' } },
    ])
    const r = await new TuCompraGateway(cfg).queryStatusByReference('ORD-0042')
    expect(r).toEqual({ status: 'approved', rawStatus: 'APROBADA', paymentId: 'TX-1' })
  })

  it('devuelve null si no hay información (codigoRespuesta = 1)', async () => {
    mockFetchSequence([
      { json: { codigoRespuesta: '0', tokenSeguridad: 'JWT-123' } },
      { json: { codigoRespuesta: '1' } },
    ])
    expect(await new TuCompraGateway(cfg).queryStatusByReference('ORD-0042')).toBeNull()
  })
})

describe('TuCompraGateway — mapStatus y extractWebhookData', () => {
  const g = new TuCompraGateway(cfg)
  it('mapea estados', () => {
    expect(g.mapStatus('APROBADA')).toBe('approved')
    expect(g.mapStatus('OK')).toBe('approved')
    expect(g.mapStatus('PENDIENTE')).toBe('pending')
    expect(g.mapStatus('RECHAZADA')).toBe('rejected')
    expect(g.mapStatus('FALLIDA')).toBe('rejected')
  })
  it('extrae la referencia del body (form y JSON)', () => {
    expect(g.extractWebhookData('referencia=ORD-0042&estado=APROBADA&numeroTransaccion=TX-1'))
      .toEqual({ orderReference: 'ORD-0042', rawStatus: 'APROBADA', paymentId: 'TX-1' })
    expect(g.extractWebhookData('{"Referencia":"ORD-0042","estado":"PENDIENTE"}'))
      .toEqual({ orderReference: 'ORD-0042', rawStatus: 'PENDIENTE', paymentId: undefined })
    expect(g.extractWebhookData('foo=bar')).toBeNull()
  })
})
