'use client'

import { useState, useRef } from 'react'
import { Icon } from '@merkiai/ui'
import MediaPicker from './MediaPicker'
import { T } from '@merkiai/ui'
import { useTx } from '@merkiai/ui'

interface Props {
  value: string
  onChange: (url: string) => void
  onUploadStateChange?: (uploading: boolean) => void
  bucket?: string
  label?: string
  /** Clase de tamaño para el área. Puede ser un aspect-ratio ('aspect-video')
   *  o una altura fija ('h-44'). Por defecto 'aspect-video'. */
  sizeClass?: string
}

export default function ImageUpload({
  value,
  onChange,
  onUploadStateChange,
  bucket = 'products',
  label = 'Imagen',
  sizeClass = 'aspect-video',
}: Props) {
  const tx = useTx()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false) // HU-357 · biblioteca
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setUploading(true)
    onUploadStateChange?.(true)
    setError('')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('bucket', bucket)

    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al subir imagen')
      setUploading(false)
      onUploadStateChange?.(false)
      return
    }

    onChange(data.url)
    setUploading(false)
    onUploadStateChange?.(false)
  }

  async function handleRemove() {
    if (!value) return
    // Extraer filename del URL público
    const parts = value.split('/')
    const filename = parts[parts.length - 1]
    await fetch('/api/admin/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, bucket }),
    })
    onChange('')
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError(tx("Solo se permiten imágenes"))
      return
    }
    upload(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      {label && <label className="font-brand text-xs text-brand-primary/50 block">{label}</label>}

      {value ? (
        /* Preview */
        <div className={`relative ${sizeClass} rounded-xl overflow-hidden bg-brand-cream border border-gray-100`}>
          <img src={value} alt="preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-brand text-xs bg-white text-brand-primary px-3 py-1.5 rounded-lg hover:bg-brand-cream"
            >
              <T>Cambiar</T>
            </button>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="font-brand text-xs bg-white text-brand-primary px-3 py-1.5 rounded-lg hover:bg-brand-cream"
            >
              <T>Biblioteca</T>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="font-brand text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600"
            >
              <T>Eliminar</T>
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`${sizeClass} border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragging
              ? 'border-brand-primary bg-brand-cream/50'
              : 'border-gray-200 hover:border-brand-primary/40 hover:bg-gray-50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <p className="font-brand text-xs text-brand-primary/50"><T>Subiendo...</T></p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <Icon name="media" size={28} className="text-brand-primary/40" />
              <p className="font-brand text-sm text-brand-primary/50">
                <T>Arrastra una imagen o</T> <span className="text-brand-primary underline"><T>haz clic</T></span>
              </p>
              <p className="font-brand text-xs text-brand-primary/30"><T>JPG, PNG, WebP — máx. 5 MB</T></p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPickerOpen(true) }}
                className="mt-1 font-brand text-xs text-brand-primary underline"
              >
                <T>o elegir de la biblioteca</T>
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {error && <p className="font-brand text-xs text-red-500">{error}</p>}

      {/* HU-357 · elegir de la biblioteca de medios (reutilizar sin re-subir) */}
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(url) => onChange(url)} mime="image" />
    </div>
  )
}
