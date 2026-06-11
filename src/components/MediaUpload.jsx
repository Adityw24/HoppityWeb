import { useState } from 'react'
import { Upload, X, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'

const SUPABASE_URL = 'https://wenhudcyvlhilpgazylg.supabase.co'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

async function compressImage(file, maxPx = 1280, quality = 0.78) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new window.Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxPx || height > maxPx) {
          const ratio = Math.min(maxPx / width, maxPx / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function MediaUpload({ label, value, onChange, multiple = true, accept = 'image/*' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileSelect = async (files) => {
    if (!files) return
    setError(null)
    setUploading(true)

    try {
      const fileArray = Array.from(files)
      const uploadedUrls = []

      for (const file of fileArray) {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File "${file.name}" exceeds 10MB limit`)
        }

        // Compress image
        const compressed = await compressImage(file, 1280, 0.78)

        // Create a clean path: just the filename with timestamp
        // This prevents nested folder structure
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const filename = `${timestamp}-${randomStr}.jpg`
        
        // Upload to properties-media bucket with simple path (no nested folders)
        const { data, error: uploadError } = await supabase.storage
          .from('properties-media')
          .upload(filename, compressed, {
            contentType: 'image/jpeg',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Construct the public URL
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/properties-media/${filename}`
        uploadedUrls.push(publicUrl)
      }

      // Update the value - either replace or append based on multiple
      if (multiple) {
        const currentUrls = Array.isArray(value) ? value : value ? [value] : []
        onChange([...currentUrls, ...uploadedUrls])
      } else {
        onChange(uploadedUrls[0])
      }
    } catch (err) {
      setError(err.message || 'Upload failed')
      console.error('MediaUpload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = (index) => {
    if (Array.isArray(value)) {
      onChange(value.filter((_, i) => i !== index))
    } else {
      onChange(null)
    }
  }

  const urls = Array.isArray(value) ? value : value ? [value] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Upload Area */}
      <label
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '24px',
          border: '2px dashed #ddd',
          borderRadius: '8px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          backgroundColor: uploading ? '#f9f9f9' : '#fafafa',
          transition: 'all 0.2s',
          opacity: uploading ? 0.6 : 1,
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!uploading) e.currentTarget.style.borderColor = '#666'
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.borderColor = '#ddd'
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.style.borderColor = '#ddd'
          if (!uploading) handleFileSelect(e.dataTransfer.files)
        }}
      >
        {uploading ? (
          <>
            <Loader style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', color: '#666' }} />
            <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Uploading…</span>
          </>
        ) : (
          <>
            <Upload style={{ width: 24, height: 24, color: '#999' }} />
            <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>
              {label || 'Upload'} {multiple ? '(multiple)' : ''}
            </span>
            <span style={{ fontSize: '11px', color: '#999' }}>or drag & drop</span>
          </>
        )}
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: 'none' }}
          disabled={uploading}
          onChange={(e) => handleFileSelect(e.currentTarget.files)}
        />
      </label>

      {/* Error Message */}
      {error && (
        <div style={{ padding: 8, backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: 4, color: '#c00', fontSize: 12 }}>
          {error}
        </div>
      )}

      {/* Preview / Paste URL Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="text"
          placeholder="Or paste an image URL directly"
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'monospace',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              const url = e.currentTarget.value.trim()
              if (multiple) {
                onChange([...urls, url])
              } else {
                onChange(url)
              }
              e.currentTarget.value = ''
            }
          }}
        />
      </div>

      {/* Uploaded Images Preview */}
      {urls.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {urls.map((url, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '100%',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid #ddd',
                backgroundColor: '#f5f5f5',
              }}
            >
              <img
                src={url}
                alt={`Preview ${i + 1}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
                aria-label="Remove image"
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info Text */}
      <p style={{ fontSize: '11px', color: '#999', lineHeight: 1.4 }}>
        JPG, PNG up to 10MB. Images are automatically optimized. {multiple ? 'You can upload multiple.' : ''}
      </p>
    </div>
  )
}
