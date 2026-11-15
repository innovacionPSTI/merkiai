'use client'

/** Imprime / guarda como PDF el estado de cuenta (diálogo del navegador). */
export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="mt-2 rounded-full border border-gray-200 px-4 py-1.5 font-brand text-xs text-brand-primary hover:border-brand-primary print:hidden">
      Imprimir / PDF
    </button>
  )
}
