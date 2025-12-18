import { useState, useEffect, useRef } from 'react'
import TodoItem from './components/TodoItem'
import './App.css'

// Helper function to load todos from localStorage
const loadTodosFromStorage = () => {
  try {
    const savedTodos = localStorage.getItem('todos')
    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos)
      
      // Validate that parsedTodos is an array
      if (Array.isArray(parsedTodos) && parsedTodos.length > 0) {
        // Add createdAt timestamp to existing tasks that don't have one (backward compatibility)
        // Use the id as fallback since it's also a timestamp
        return parsedTodos.map(todo => ({
          id: todo.id || Date.now(),
          text: todo.text || '',
          completed: todo.completed || false,
          createdAt: todo.createdAt || todo.id || Date.now()
        }))
      }
    }
  } catch (error) {
    console.error('Error loading todos from localStorage:', error)
  }
  return []
}

function App() {
  // Initialize state from localStorage using lazy initialization
  const [todos, setTodos] = useState(() => loadTodosFromStorage())
  
  // State to manage the input field for new todos
  const [inputValue, setInputValue] = useState('')
  
  // State to track items that are being removed (for animation)
  const [exitingIds, setExitingIds] = useState([])
  
  // Ref to access the input element for focusing
  const inputRef = useRef(null)

  // Save todos to localStorage whenever todos change
  // This includes: adding tasks, deleting tasks, toggling completion, clearing completed
  useEffect(() => {
    try {
      // Save all task properties: id, text, completed, createdAt
      localStorage.setItem('todos', JSON.stringify(todos))
    } catch (error) {
      console.error('Error saving todos to localStorage:', error)
      // Handle quota exceeded error or other storage issues
      if (error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded. Please clear some tasks or browser data.')
      }
    }
  }, [todos])

  /**
   * Add a new todo to the list
   * Only adds if input is not empty (after trimming whitespace)
   * Automatically focuses the input after adding for quick task entry
   */
  const addTodo = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue === '') return

    const newTodo = {
      id: Date.now(), // Use timestamp as unique ID
      text: trimmedValue,
      completed: false,
      createdAt: Date.now() // Store creation timestamp
    }

    setTodos([...todos, newTodo])
    setInputValue('') // Clear input field
    
    // Focus the input field after adding a task for better UX
    // Use setTimeout to ensure the state update has completed
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  /**
   * Handle Enter key press in input field
   * Prevents default form submission behavior and adds the task
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault() // Prevent any default form submission behavior
      addTodo()
    }
  }

  /**
   * Delete a todo by its ID
   */
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  /**
   * Toggle the completed status of a todo
   */
  const toggleComplete = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  /**
   * Update the text of a todo
   */
  const updateTodo = (id, newText) => {
    const trimmedText = newText.trim()
    if (trimmedText === '') return
    
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, text: trimmedText } : todo
    ))
  }

  /**
   * Remove all completed tasks from the list with animation
   * localStorage will be updated automatically via useEffect
   */
  const clearCompleted = () => {
    const completedIds = todos.filter(todo => todo.completed).map(todo => todo.id)
    
    if (completedIds.length === 0) return
    
    // Mark completed items as exiting to trigger animation
    setExitingIds(completedIds)
    
    // Wait for animation to complete before actually removing
    setTimeout(() => {
      setTodos(todos.filter(todo => !todo.completed))
      setExitingIds([]) // Clear exiting IDs
    }, 400) // Match animation duration (400ms)
  }

  // Calculate task statistics
  const totalTasks = todos.length
  const completedTasks = todos.filter(todo => todo.completed).length

  return (
    <div className="app">
      <div className="todo-container">
        <h1 className="todo-title">My Todo List</h1>
        
        {/* Task counter showing completed and total tasks */}
        {totalTasks > 0 && (
          <div className="task-counter">
            <span className="counter-text">
              Completed: <strong>{completedTasks}</strong> / Total: <strong>{totalTasks}</strong>
            </span>
          </div>
        )}
        
        {/* Input section for adding new todos */}
        <div className="input-section">
          <input
            ref={inputRef}
            type="text"
            className="todo-input"
            placeholder="Add a new task... (Press Enter to add)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button className="add-button" onClick={addTodo}>
            Add
          </button>
        </div>

        {/* List of todos */}
        <div className="todo-list">
          {todos.length === 0 ? (
            <div className="empty-message">
              <p className="empty-message-icon">✨</p>
              <p className="empty-message-text">Your todo list is empty!</p>
              <p className="empty-message-subtext">Add your first task above to get started.</p>
            </div>
          ) : (
            todos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onDelete={deleteTodo}
                onToggleComplete={toggleComplete}
                onUpdate={updateTodo}
                isExiting={exitingIds.includes(todo.id)}
              />
            ))
          )}
        </div>

        {/* Footer showing task count and clear completed button */}
        {todos.length > 0 && (
          <div className="todo-footer">
            <span>
              {todos.filter(todo => !todo.completed).length} task(s) remaining
            </span>
            {completedTasks > 0 && (
              <button className="clear-completed-button" onClick={clearCompleted}>
                Clear Completed ({completedTasks})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App

