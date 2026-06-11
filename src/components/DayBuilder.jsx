import { X, ChevronUp, ChevronDown } from 'lucide-react'
import ArrayField from './ArrayField'

export default function DayBuilder({ days = [], onChange }) {
  const handleAddDay = () => {
    const dayNum = days.length + 1
    onChange([
      ...days,
      {
        day_number: dayNum,
        title: `Day ${dayNum}`,
        description: '',
        highlights: [],
        meals: [],
        accommodation: '',
        activities: [],
      },
    ])
  }

  const handleRemoveDay = (index) => {
    const updated = days.filter((_, i) => i !== index)
    // Renumber remaining days
    updated.forEach((day, i) => {
      day.day_number = i + 1
      day.title = `Day ${i + 1}`
    })
    onChange(updated)
  }

  const handleUpdateDay = (index, field, value) => {
    const updated = [...days]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const handleMoveDay = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === days.length - 1)) {
      return
    }
    const updated = [...days]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    // Renumber all days
    updated.forEach((day, i) => {
      day.day_number = i + 1
      day.title = `Day ${i + 1}`
    })
    onChange(updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {days.map((day, i) => (
        <div
          key={i}
          style={{
            padding: 16,
            border: '1px solid #ddd',
            borderRadius: 6,
            backgroundColor: '#fafafa',
          }}
        >
          {/* Header with controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#333', margin: 0 }}>Day {day.day_number}</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => handleMoveDay(i, 'up')}
                disabled={i === 0}
                style={{
                  padding: '6px 8px',
                  backgroundColor: i === 0 ? '#eee' : '#fff',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  cursor: i === 0 ? 'not-allowed' : 'pointer',
                  opacity: i === 0 ? 0.5 : 1,
                }}
                aria-label="Move up"
              >
                <ChevronUp style={{ width: 14, height: 14 }} />
              </button>
              <button
                type="button"
                onClick={() => handleMoveDay(i, 'down')}
                disabled={i === days.length - 1}
                style={{
                  padding: '6px 8px',
                  backgroundColor: i === days.length - 1 ? '#eee' : '#fff',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  cursor: i === days.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: i === days.length - 1 ? 0.5 : 1,
                }}
                aria-label="Move down"
              >
                <ChevronDown style={{ width: 14, height: 14 }} />
              </button>
              <button
                type="button"
                onClick={() => handleRemoveDay(i)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: 4,
                  color: '#c00',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 500,
                }}
                aria-label="Remove day"
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6 }}>
                Title
              </label>
              <input
                type="text"
                value={day.title}
                onChange={(e) => handleUpdateDay(i, 'title', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 13,
                  fontFamily: '"DM Sans", sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6 }}>
                Description
              </label>
              <textarea
                value={day.description}
                onChange={(e) => handleUpdateDay(i, 'description', e.target.value)}
                placeholder="What happens this day?"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 13,
                  fontFamily: '"DM Sans", sans-serif',
                  minHeight: 80,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Meals */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6 }}>
                Meals
              </label>
              <ArrayField
                values={day.meals || []}
                onChange={(v) => handleUpdateDay(i, 'meals', v)}
                placeholder="e.g., Breakfast, Lunch, Dinner"
              />
            </div>

            {/* Highlights */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6 }}>
                Highlights
              </label>
              <ArrayField
                values={day.highlights || []}
                onChange={(v) => handleUpdateDay(i, 'highlights', v)}
                placeholder="e.g., Trek to viewpoint, Local market visit"
              />
            </div>

            {/* Activities */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6 }}>
                Activities
              </label>
              <ArrayField
                values={day.activities || []}
                onChange={(v) => handleUpdateDay(i, 'activities', v)}
                placeholder="e.g., Hiking, Photography"
              />
            </div>

            {/* Accommodation */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6 }}>
                Accommodation
              </label>
              <input
                type="text"
                value={day.accommodation || ''}
                onChange={(e) => handleUpdateDay(i, 'accommodation', e.target.value)}
                placeholder="Where guests will stay"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 13,
                  fontFamily: '"DM Sans", sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add Day Button */}
      <button
        type="button"
        onClick={handleAddDay}
        style={{
          padding: '12px 16px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
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
        + Add Day
      </button>
    </div>
  )
}
