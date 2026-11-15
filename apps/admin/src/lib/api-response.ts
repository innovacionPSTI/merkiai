/**
 * `NextResponse` del panel con mensajes traducidos (E28 · HU-466 F6).
 * Igual a `next/server`, salvo `json()`: si el cuerpo trae mensajes (`error`,
 * `message`, `errors`…) se traducen al idioma del usuario. La traducción es
 * asíncrona (lee la preferencia), así que el cuerpo se emite como stream; el
 * resto de respuestas no cambia.
 */
import { NextResponse as BaseResponse } from 'next/server'
import { hasMessages } from '@merkiai/i18n'
import { localizeForPanel } from './server-i18n'

export class NextResponse<Body = unknown> extends BaseResponse<Body> {
  static json<JsonBody>(body: JsonBody, init?: ResponseInit): BaseResponse<JsonBody> {
    if (process.env.NODE_ENV === 'test' || !hasMessages(body)) return BaseResponse.json(body, init)
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify(await localizeForPanel(body))))
        controller.close()
      },
    })
    const headers = new Headers(init?.headers)
    if (!headers.has('content-type')) headers.set('content-type', 'application/json')
    return new BaseResponse<JsonBody>(stream, { ...init, headers })
  }
}
