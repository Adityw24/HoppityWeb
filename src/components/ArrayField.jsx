import { X } from 'lucide-react'

export default function ArrayField({ values = [], onChange, placeholder = 'Add item' }) {
  const handleAdd = () => {
    onChange([...values, ''])
  }

  const handleChange = (index, value) => {
    const updated = [...values]
    updated[index] = value
    onChange(updated)
  }

  const handleRemove = (index) => {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {values.map((value, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(i, e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '13px',
              fontFamily: '"DM Sans", sans-serif',
            }}
          />
          <button
            type="button"
            onClick={() => handleRemove(i)}
            style={{
              padding: '6px 10px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c00',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '12px',
              fontWeight: 500,
            }}
            aria-label="Remove item"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          color: '#333',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#e0e0e0'
          e.currentTarget.style.borderColor = '#999'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f0f0'
          e.currentTarget.style.borderColor = '#ddd'
        }}
      >
        + Add {placeholder}
      </button>
    </div>
  )
}
