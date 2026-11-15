/**
 * Formateador de mensajes ICU (subconjunto) sin dependencias (HU-460).
 *
 * Soporta lo que usan los catálogos de Merkiai:
 *  - Interpolación:      `Hola, {name}`
 *  - Plural:             `{count, plural, =0 {Sin productos} one {# producto} other {# productos}}`
 *  - Select:             `{gender, select, female {Bienvenida} other {Bienvenido}}`
 *  - Número:             `{total, number}`
 *  - Escape con comillas simples: `'{'` literal, `''` = comilla.
 *
 * Es compatible con la sintaxis ICU MessageFormat (la de next-intl), de modo que
 * los catálogos sirven igual si más adelante se usa esa librería en los componentes.
 */

export type MessageValues = Record<string, string | number | boolean | null | undefined | Date>

type Node =
  | { t: 'text'; v: string }
  | { t: 'arg'; name: string }
  | { t: 'number'; name: string }
  | { t: 'pound' }
  | { t: 'plural'; name: string; offset: number; options: Record<string, Node[]> }
  | { t: 'select'; name: string; options: Record<string, Node[]> }

export class MessageSyntaxError extends Error {}

const cache = new Map<string, Node[]>()

export function parseMessage(message: string): Node[] {
  const hit = cache.get(message)
  if (hit) return hit
  const p = new Parser(message)
  const nodes = p.parseNodes(false, false)
  if (p.i < message.length) throw new MessageSyntaxError(`Llave de cierre sin abrir en: ${message}`)
  if (cache.size > 2000) cache.clear()
  cache.set(message, nodes)
  return nodes
}

class Parser {
  i = 0
  constructor(private readonly s: string) {}

  parseNodes(inPlural: boolean, nested: boolean): Node[] {
    const out: Node[] = []
    let text = ''
    const flush = () => { if (text) { out.push({ t: 'text', v: text }); text = '' } }
    while (this.i < this.s.length) {
      const c = this.s[this.i]
      if (c === "'") {
        // '' → comilla literal · '{…}' → texto literal
        if (this.s[this.i + 1] === "'") { text += "'"; this.i += 2; continue }
        const next = this.s[this.i + 1]
        if (next === '{' || next === '}' || (inPlural && next === '#')) {
          const end = this.s.indexOf("'", this.i + 1)
          if (end === -1) { text += this.s.slice(this.i + 1); this.i = this.s.length; continue }
          text += this.s.slice(this.i + 1, end); this.i = end + 1; continue
        }
        text += c; this.i++; continue
      }
      if (c === '{') { flush(); out.push(this.parseArg()); continue }
      if (c === '}') {
        if (!nested) throw new MessageSyntaxError(`Llave de cierre sin abrir en: ${this.s}`)
        break
      }
      if (c === '#' && inPlural) { flush(); out.push({ t: 'pound' }); this.i++; continue }
      text += c; this.i++
    }
    flush()
    return out
  }

  private ws() { while (this.i < this.s.length && /\s/.test(this.s[this.i])) this.i++ }

  private ident(): string {
    this.ws()
    const m = /^[^\s{},]+/.exec(this.s.slice(this.i))
    if (!m) throw new MessageSyntaxError(`Se esperaba un identificador en la posición ${this.i}: ${this.s}`)
    this.i += m[0].length
    this.ws()
    return m[0]
  }

  private expect(ch: string) {
    this.ws()
    if (this.s[this.i] !== ch) throw new MessageSyntaxError(`Se esperaba "${ch}" en la posición ${this.i}: ${this.s}`)
    this.i++
  }

  private parseArg(): Node {
    this.expect('{')
    const name = this.ident()
    if (this.s[this.i] === '}') { this.i++; return { t: 'arg', name } }
    this.expect(',')
    const type = this.ident()
    if (type === 'number') {
      if (this.s[this.i] === ',') { this.i++; this.ident() } // estilo (ignorado: se usa formatNumber)
      this.expect('}')
      return { t: 'number', name }
    }
    if (type !== 'plural' && type !== 'select' && type !== 'selectordinal') {
      throw new MessageSyntaxError(`Tipo de argumento no soportado "${type}": ${this.s}`)
    }
    this.expect(',')
    let offset = 0
    const options: Record<string, Node[]> = {}
    this.ws()
    while (this.i < this.s.length && this.s[this.i] !== '}') {
      const key = this.ident()
      if (key.startsWith('offset:')) { offset = Number(key.slice(7)) || 0; continue }
      this.expect('{')
      options[key] = this.parseNodes(type !== 'select', true)
      this.expect('}')
      this.ws()
    }
    this.expect('}')
    if (!options.other) throw new MessageSyntaxError(`Falta la opción "other" en ${type} de "${name}": ${this.s}`)
    return type === 'select' ? { t: 'select', name, options } : { t: 'plural', name, offset, options }
  }
}

function render(nodes: Node[], values: MessageValues, locale: string, pluralValue: number | null): string {
  let out = ''
  for (const n of nodes) {
    switch (n.t) {
      case 'text': out += n.v; break
      case 'pound': out += pluralValue === null ? '#' : new Intl.NumberFormat(locale).format(pluralValue); break
      case 'arg': {
        const v = values[n.name]
        out += v === undefined || v === null ? `{${n.name}}` : v instanceof Date ? v.toISOString() : String(v)
        break
      }
      case 'number': {
        const v = Number(values[n.name])
        out += Number.isFinite(v) ? new Intl.NumberFormat(locale).format(v) : `{${n.name}}`
        break
      }
      case 'select': {
        const v = String(values[n.name] ?? 'other')
        out += render(n.options[v] ?? n.options.other, values, locale, pluralValue)
        break
      }
      case 'plural': {
        const raw = Number(values[n.name])
        const num = Number.isFinite(raw) ? raw : 0
        const exact = n.options[`=${num}`]
        const branch = exact ?? n.options[new Intl.PluralRules(locale).select(num - n.offset)] ?? n.options.other
        out += render(branch, values, locale, num - n.offset)
        break
      }
    }
  }
  return out
}

/** Formatea un mensaje ICU. Un argumento faltante se deja visible como `{nombre}` (no rompe la UI). */
export function formatMessage(message: string, values: MessageValues = {}, locale = 'es-CO'): string {
  return render(parseMessage(message), values, locale, null)
}
