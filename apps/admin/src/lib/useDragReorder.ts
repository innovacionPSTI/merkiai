'use client'

import { useState } from 'react'

/**
 * HU-126 · Hook reutilizable de reordenamiento por arrastre (drag-and-drop).
 * Encapsula el estado (índice arrastrado / índice bajo el cursor) y devuelve los
 * props para el contenedor arrastrable y el handle. El consumidor decide la
 * presentación (hueco en lista vertical, anillo en grilla, etc.) usando
 * `dragIdx`/`overIdx`, y persiste el nuevo orden en `onReorder(from, to)`.
 */
export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  function reset() { setDragIdx(null); setOverIdx(null) }

  /** Props para el elemento que recibe el drop (cada ítem de la lista). */
  function dropProps(i: number) {
    return {
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (dragIdx !== null && overIdx !== i) setOverIdx(i) },
      onDrop: (e: React.DragEvent) => { e.preventDefault(); if (dragIdx !== null) onReorder(dragIdx, i); reset() },
    }
  }

  /** Props para el handle (o la tarjeta) que inicia el arrastre. */
  function handleProps(i: number) {
    return {
      draggable: true,
      onDragStart: () => { setDragIdx(i); setOverIdx(i) },
      onDragEnd: reset,
    }
  }

  /** Mueve un elemento de un array a otra posición (helper puro). */
  function arrayMove<T>(arr: T[], from: number, to: number): T[] {
    if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr
    const next = [...arr]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    return next
  }

  return { dragIdx, overIdx, dropProps, handleProps, arrayMove, reset }
}
