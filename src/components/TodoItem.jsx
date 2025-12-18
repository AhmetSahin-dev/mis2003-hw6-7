import { useState, useEffect, useRef } from 'react'

/**
 * TodoItem Component
 * Displays a single todo item with options to mark as complete and delete
 */

// Sound configuration - Set to false to disable sound
const ENABLE_COMPLETION_SOUND = true

function TodoItem({ todo, onDelete, onToggleComplete, onUpdate, isExiting = false }) {
  // State to track XP orbs to show
  const [xpOrbs, setXpOrbs] = useState([])
  const [wasCompleted, setWasCompleted] = useState(todo.completed)
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  // Ref for audio element
  const audioRef = useRef(null)

  // Check if task was just completed
  useEffect(() => {
    if (todo.completed && !wasCompleted) {
      // Play completion sound if enabled
      if (ENABLE_COMPLETION_SOUND && audioRef.current) {
        audioRef.current.volume = 0.15 // Set volume to 15%
        
        // Function to set audio to last 3 seconds and play
        const playLast3Seconds = () => {
          const duration = audioRef.current.duration
          if (duration && !isNaN(duration) && duration > 3) {
            audioRef.current.currentTime = duration - 3
          } else {
            audioRef.current.currentTime = 0
          }
          audioRef.current.play().catch(error => {
            // Handle autoplay restrictions gracefully
            console.log('Could not play sound:', error)
          })
        }
        
        // If metadata already loaded, set time and play immediately
        if (audioRef.current.readyState >= 1 && audioRef.current.duration) {
          playLast3Seconds()
        } else {
          // Wait for metadata to load, then set time and play
          audioRef.current.addEventListener('loadedmetadata', playLast3Seconds, { once: true })
          // Also try to load if not already loading
          if (audioRef.current.readyState === 0) {
            audioRef.current.load()
          }
        }
      }
      
      // Task was just completed - show random number of XP orbs (5-8)
      const orbCount = Math.floor(Math.random() * 4) + 5 // Random between 5 and 8
      const orbs = []
      
      for (let i = 0; i < orbCount; i++) {
        // Randomly choose between yellow and green
        const type = Math.random() > 0.5 ? 'yellow' : 'green'
        // Calculate angle and positions for circular distribution
        const angle = (Math.PI * 2 * i) / orbCount + Math.random() * 0.3 - 0.15
        const delay = i * 0.08 + Math.random() * 0.15
        
        // Pre-calculate end positions for CSS
        const distance = 120
        const endX = Math.cos(angle) * distance
        const endY = Math.sin(angle) * distance - 60
        
        orbs.push({
          id: i,
          type,
          angle,
          delay,
          endX,
          endY
        })
      }
      
      setXpOrbs(orbs)
      
      // Clear orbs after animation completes
      setTimeout(() => {
        setXpOrbs([])
      }, 1500)
    }
    setWasCompleted(todo.completed)
  }, [todo.completed, wasCompleted])

  /**
   * Format the creation timestamp into a readable date string
   * Falls back to empty string if timestamp doesn't exist (for backward compatibility)
   */
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    // Show relative time for recent tasks
    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      // Show date for older tasks
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  /**
   * Handle click on todo item
   * Toggles completion unless clicking on delete button, edit button, or checkbox
   */
  const handleItemClick = (e) => {
    // Don't toggle if clicking on buttons or checkbox or if editing
    if (
      e.target.closest('.delete-button') || 
      e.target.closest('.edit-button') ||
      e.target.closest('.custom-checkbox-container') ||
      isEditing
    ) {
      return
    }
    // Toggle completion
    onToggleComplete(todo.id)
  }

  /**
   * Handle edit button click
   */
  const handleEditClick = (e) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditText(todo.text)
  }

  /**
   * Handle save edit
   */
  const handleSaveEdit = (e) => {
    e.stopPropagation()
    const trimmedText = editText.trim()
    if (trimmedText !== '') {
      onUpdate(todo.id, trimmedText)
    }
    setIsEditing(false)
  }

  /**
   * Handle cancel edit
   */
  const handleCancelEdit = (e) => {
    e.stopPropagation()
    setEditText(todo.text)
    setIsEditing(false)
  }

  /**
   * Handle Enter key in edit input
   */
  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit(e)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit(e)
    }
  }

  return (
    <div 
      className={`todo-item ${todo.completed ? 'completed' : ''} ${isExiting ? 'exiting' : ''} ${xpOrbs.length > 0 ? 'completing' : ''}`}
      onClick={handleItemClick}
    >
      {/* Audio element for completion sound */}
      {ENABLE_COMPLETION_SOUND && (
        <audio
          ref={audioRef}
          src="/Taskcompletesound.mp3"
          preload="auto"
        />
      )}
      
      {/* XP Orbs effect overlay */}
      {xpOrbs.length > 0 && (
        <div className="xp-orbs-overlay">
          {xpOrbs.map((orb) => (
            <img
              key={orb.id}
              src={orb.type === 'yellow' ? '/xporbyellow.png' : '/xporbgreen.png'}
              alt={`XP orb ${orb.type}`}
              className={`xp-orb xp-orb-${orb.type}`}
              style={{
                '--end-x': `${orb.endX}px`,
                '--end-y': `${orb.endY}px`,
                '--delay': `${orb.delay}s`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Custom checkbox to mark todo as completed */}
      <label className="custom-checkbox-container" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="todo-checkbox"
          checked={todo.completed}
          onChange={() => onToggleComplete(todo.id)}
          aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        />
        <span className="custom-checkbox">
          {todo.completed && (
            <svg className="checkmark" viewBox="0 0 24 24" fill="none">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </span>
      </label>
      
      {/* Todo text container or edit input */}
      {isEditing ? (
        <div className="todo-edit-container" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            className="todo-edit-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleEditKeyDown}
            autoFocus
          />
          <div className="todo-edit-buttons">
            <button
              className="save-button"
              onClick={handleSaveEdit}
              aria-label="Save changes"
            >
              ✓
            </button>
            <button
              className="cancel-button"
              onClick={handleCancelEdit}
              aria-label="Cancel editing"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="todo-text-container">
            <span className="todo-text">{todo.text}</span>
            {todo.createdAt && (
              <span className="todo-timestamp">{formatTimestamp(todo.createdAt)}</span>
            )}
          </div>
          
          {/* Edit button */}
          <button
            className="edit-button"
            onClick={handleEditClick}
            aria-label={`Edit "${todo.text}"`}
          >
            ✎
          </button>
          
          {/* Delete button */}
          <button
            className="delete-button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(todo.id)
            }}
            aria-label={`Delete "${todo.text}"`}
          >
            ×
          </button>
        </>
      )}
    </div>
  )
}

export default TodoItem

