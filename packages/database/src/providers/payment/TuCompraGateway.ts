/**
 * TuCompraGateway — modalidad INTEGRADOR de Tu Compra (API REST, token JWT).
 * Doc: https://desarrolladores.tucompra.net/manuales/rest
 *
 * Flujo integrador (transaccional, por medio de pago):
 *   1. POST /autenticar { usuario, clave, terminal } → tokenSeguridad (JWT)
 *   2. POST /confirmacionTransaccionMedioPago { Referencia(=order_number),
 *          Valortotal, MetodoPago{ id, campo1..10 }, datos del comprador, token }
 *          → { CodigoRespuesta, estado, urlBanco, CodigoSeguimiento, numeroTransaccion }
 *      · `Referencia` = order_number → correlación real del pedido.
 *      · `urlBanco` = URL a la que se redirige al cliente (PSE, etc.).
 *   3. Estado autoritativo vía POST /consultarEstadoTransaccion (por Referencia).
 *
 * NOTA: `crearBotonPago` (botón/link reutilizable, sin Referencia) es OTRA modalidad
 * y NO se usa aquí. Cada medio (PSE/Nequi/Daviplata/Referenciado/Tarjeta) llena el
 * objeto `MetodoPago` con su `id` (Ver Tabla de Valores) y sus campos; la tarjeta
 * además exige cifrar los datos con la llave pública RSA (rompe PCI SAQ A).
 */

import type { PaymentGateway, CreatePaymentParams, PaymentStatus, WebhookPaymentData } from './types'

export interface TuCompraConfig {
  usuario: string
  clave: string
  terminal: string
  /** URL base. Demo: https://ws.tucompra.net/tcWSDRest/api · Prod: https://ws2.tucompra.com.co/tcWSDRest/api */
  apiUrl?: string
  /** Llave pública RSA (solo pago de tarjeta directo — "Cifrado de Valores"). */
  publicKey?: string
}

/** Objeto MetodoPago del servicio confirmacionTransaccionMedioPago. */
export interface TuCompraMetodoPago {
  id: string
  campo1?: string
  campo2?: string
  campo3?: string
  campo4?: string
  campo5?: string
  campo6?: string
  campo7?: string
  campo8?: string
  campo9?: string
  campo10?: string
}

/** Datos del comprador + transacción para el flujo integrador. */
export interface TuCompraTxnParams {
  referencia: string          // order_number (idFactura)
  valorTotal: number          // COP entero (sin decimales)
  descripcion: string
  correo: string
  nombre: string
  apellido?: string
  documento?: string
  tipoDocumento?: string      // Extra9: 1 CC, 2 NIT, 3 CE, 4 TI, 5 Pasaporte
  telefono?: string
  celular?: string
  direccion?: string
  ciudad?: string
  pais?: string
  ip?: string
  divisa?: string             // Extra8: COP (def), USD, EUR
}

export interface TuCompraTxnResult {
  codigoRespuesta: string     // 0 exitosa, 1 rechazada, 2 pendiente, 99 error
  descripcion?: string
  codigoSeguimiento?: string
  estado?: string             // PENDIENTE, RECHAZADA, FALLIDA
  urlBanco?: string           // URL de redirección (PSE, etc.)
  numeroTransaccion?: string
}

const DEMO_URL = 'https://ws.tucompra.net/tcWSDRest/api'

export class TuCompraGateway implements PaymentGateway {
  readonly name = 'tucompra'

  constructor(private readonly cfg: TuCompraConfig) {}

  private base(): string {
    return (this.cfg.apiUrl || DEMO_URL).replace(/\/$/, '')
  }

  /**
   * Constructores de `MetodoPago` por tipo (el `id` es configurable porque
   * DIFIERE entre demo y producción — Ver Tabla de Valores).
   *   PSE:  campo1=código banco, campo3=tipo persona (0 natural/1 jurídica), campo4=url retorno
   *   Billetera (Nequi/Daviplata): el celular/documento viajan en los datos del comprador
   *   Referenciado: solo el id
   */
  static metodoPSE(id: string, bankCode: string, personType: '0' | '1', returnUrl: string): TuCompraMetodoPago {
    return { id, campo1: bankCode, campo3: personType, campo4: returnUrl }
  }

  static metodoSimple(id: string): TuCompraMetodoPago {
    return { id }
  }

  /** Autentica y devuelve el tokenSeguridad (JWT). */
  async authenticate(): Promise<string> {
    const res = await fetch(`${this.base()}/autenticar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: this.cfg.usuario, clave: this.cfg.clave, terminal: this.cfg.terminal }),
    })
    if (!res.ok) throw new Error(`Tu Compra autenticar falló ${res.status}`)
    const data = (await res.json()) as { codigoRespuesta?: string; mensaje?: string; tokenSeguridad?: string }
    if (data.codigoRespuesta !== '0' || !data.tokenSeguridad) {
      throw new Error(`Tu Compra autenticación rechazada: ${data.mensaje ?? data.codigoRespuesta ?? 'sin detalle'}`)
    }
    return data.tokenSeguridad
  }

  /**
   * Lista de bancos PSE para el selector del checkout.
   * POST /listarBancos { idMetodoPago (=id PSE), terminal, accessToken } → [{codigoBanco, nombreBanco}]
   */
  async listarBancos(idMetodoPago: string): Promise<Array<{ codigo: string; nombre: string }>> {
    try {
      const token = await this.authenticate()
      const res = await fetch(`${this.base()}/listarBancos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idMetodoPago, terminal: this.cfg.terminal, accessToken: token }),
      })
      if (!res.ok) return []
      const data = (await res.json()) as Array<{ codigoBanco?: string; nombreBanco?: string }>
      return (Array.isArray(data) ? data : [])
        .map((b) => ({ codigo: b.codigoBanco ?? '', nombre: b.nombreBanco ?? '' }))
        .filter((b) => b.codigo)
    } catch {
      return []
    }
  }

  /**
   * Crea una transacción integrador (confirmacionTransaccionMedioPago) para el
   * MetodoPago indicado. Devuelve la respuesta cruda (incluida urlBanco para
   * redirigir). El caller arma el MetodoPago según el medio (PSE/Nequi/…).
   */
  async createIntegradorTransaction(params: TuCompraTxnParams, metodo: TuCompraMetodoPago): Promise<TuCompraTxnResult> {
    const token = await this.authenticate()
    const total = String(Math.round(params.valorTotal))

    const body = {
      MetodoPago: {
        id: metodo.id,
        campo1: metodo.campo1 ?? '', campo2: metodo.campo2 ?? '', campo3: metodo.campo3 ?? '',
        campo4: metodo.campo4 ?? '', campo5: metodo.campo5 ?? '', campo6: metodo.campo6 ?? '',
        campo7: metodo.campo7 ?? '', campo8: metodo.campo8 ?? '', campo9: metodo.campo9 ?? '',
        campo10: metodo.campo10 ?? '',
      },
      Referencia: params.referencia,
      Valortotal: total,
      Valorbase: total,
      Valoriva: '0',
      Terminal: this.cfg.terminal,
      Descripcion: params.descripcion,
      Documento: params.documento ?? '',
      Nombre: params.nombre,
      Apellido: params.apellido ?? '',
      Direccion: params.direccion ?? '',
      Telefono: params.telefono ?? '',
      Celular: params.celular ?? '',
      Ciudad: params.ciudad ?? '',
      Pais: params.pais ?? 'CO',
      Correo: params.correo,
      Extra8: params.divisa ?? 'COP',
      Extra9: params.tipoDocumento ?? '',
      ip: params.ip ?? '',
      tokenSeguridad: token,
    }

    const res = await fetch(`${this.base()}/confirmacionTransaccionMedioPago`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '(sin cuerpo)')
      throw new Error(`Tu Compra confirmacionTransaccion falló ${res.status}: ${text}`)
    }
    const d = (await res.json()) as Record<string, string>
    return {
      codigoRespuesta: d.CodigoRespuesta ?? d.codigoRespuesta ?? '99',
      descripcion: d.Descripcion ?? d.descripcion,
      codigoSeguimiento: d.CodigoSeguimiento ?? d.codigoSeguimiento,
      estado: d.estado,
      urlBanco: d.urlBanco,
      numeroTransaccion: d.numeroTransaccion,
    }
  }

  /**
   * Interfaz PaymentGateway. En modalidad integrador el pago es POR MÉTODO y
   * requiere seleccionar el medio (y banco/celular/tarjeta) en el checkout, por lo
   * que no hay una URL genérica: se debe usar `createIntegradorTransaction`.
   */
  async createPaymentUrl(_params: CreatePaymentParams): Promise<string> {
    throw new Error(
      'Tu Compra (integrador) requiere seleccionar el medio de pago (PSE/Nequi/…) en el checkout. Usa createIntegradorTransaction.',
    )
  }

  /**
   * Fallback/reconcile: consulta el estado por la referencia (order_number).
   * POST /consultarEstadoTransaccion.
   */
  async queryStatusByReference(
    reference: string,
  ): Promise<{ status: PaymentStatus; rawStatus: string; paymentId?: string } | null> {
    try {
      const token = await this.authenticate()
      const res = await fetch(`${this.base()}/consultarEstadoTransaccion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terminal: this.cfg.terminal,
          tokenSeguridad: token,
          referencia: reference,
          codigoSeguimiento: '',
          estadoPago: true,
          transaccionConfirmada: true,
          numeroTransaccion: true,
        }),
      })
      if (!res.ok) return null
      const data = (await res.json()) as {
        codigoRespuesta?: string
        estadoPago?: string
        transaccionConfirmada?: string
        numeroTransaccion?: string
      }
      if (data.codigoRespuesta !== '0') return null // 1 sin info, 99 error
      const rawStatus = data.estadoPago ?? (data.transaccionConfirmada === 'true' ? 'CONFIRMADA' : '')
      if (!rawStatus) return null
      return { status: this.mapStatus(rawStatus), rawStatus, paymentId: data.numeroTransaccion ?? undefined }
    } catch {
      return null
    }
  }

  /**
   * La URL de Confirmación de Tu Compra (panel del comercio) hace POST con el
   * resultado; no exponemos una firma verificable, así que el handler re-consulta
   * el estado autoritativo. Aquí solo se retorna true (la verdad la da la API).
   */
  verifyWebhook(): boolean {
    return true
  }

  /** Extrae la referencia (order_number) de la notificación (form-encoded o JSON). */
  extractWebhookData(body: unknown): WebhookPaymentData | null {
    try {
      let referencia: string | null = null
      let estado: string | null = null
      let paymentId: string | undefined

      const str = typeof body === 'string' ? body : String(body ?? '')
      if (str.trim().startsWith('{')) {
        const j = JSON.parse(str) as Record<string, string>
        // "Numero Factura" de la sonda de confirmación = order_number
        referencia = j.numeroFactura ?? j.NumeroFactura ?? j.referencia ?? j.Referencia ?? j.idFactura ?? j.factura ?? null
        estado = j.estado ?? j.estadoPago ?? j.transaccionAprobada ?? null
        paymentId = j.numeroTransaccion ?? j.CodigoSeguimiento ?? j.codigoSeguimiento ?? undefined
      } else {
        const p = new URLSearchParams(str)
        referencia = p.get('numeroFactura') ?? p.get('NumeroFactura') ?? p.get('referencia') ?? p.get('Referencia') ?? p.get('idFactura') ?? p.get('factura')
        estado = p.get('estado') ?? p.get('estadoPago') ?? p.get('transaccionAprobada')
        paymentId = p.get('numeroTransaccion') ?? p.get('codigoSeguimiento') ?? undefined
      }

      if (!referencia) return null
      return { orderReference: referencia, rawStatus: estado ?? '', paymentId: paymentId ?? undefined }
    } catch {
      return null
    }
  }

  mapStatus(rawStatus: string): PaymentStatus {
    const s = (rawStatus || '').toUpperCase()
    if (s === 'TRUE' || s === '0' || /APROB|CONFIRM|PAGAD|EXITOS|ACEPT/.test(s)) return 'approved'
    if (s === '1' || /RECHAZ|ANUL|FALL|CANCEL|DECLIN/.test(s)) return 'rejected'
    return 'pending' // PENDIENTE, '2', etc.
  }
}
