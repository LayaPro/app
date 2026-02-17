import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { todoApi } from '../../services/api';
import { Select } from '../ui/Select';
import styles from './TodoList.module.css';

interface Todo {
  todoId: string;
  description: string;
  isDone: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  redirectUrl?: string;
  createdAt: string;
  projectId?: string;
  proposalId?: string;
  eventId?: string;
}

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodos();
  }, [filter]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const params = filter === 'all' ? {} : { status: filter, limit: 5 };
      const response = await todoApi.getAll(params);
      setTodos(response.todos || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTodo = async (todoId: string, isDone: boolean) => {
    try {
      await todoApi.update(todoId, { isDone: !isDone });
      fetchTodos();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleTodoClick = (todo: Todo) => {
    if (todo.redirectUrl) {
      navigate(todo.redirectUrl);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (loading) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.loading}>Loading tasks...</div>
      </div>
    );
  }

  const filterOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'all', label: 'All' }
  ];

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <div className={styles.titleSection}>
          <svg className={styles.chartIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className={styles.chartTitle}>My Tasks</h3>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.filterWrapper}>
            <Select
              value={filter}
              onChange={(value) => setFilter(value as 'all' | 'pending' | 'completed')}
              options={filterOptions}
              placeholder="Filter"
              className={styles.filterSelect}
            />
          </div>
          <Link to="/todos" className={styles.viewAllLink}>
            View All →
          </Link>
        </div>
      </div>

      <div className={styles.todoList}>
        {todos.length === 0 ? (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No tasks {filter === 'pending' ? 'pending' : filter === 'completed' ? 'completed' : 'found'}</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.todoId}
              className={`${styles.todoItem} ${todo.isDone ? styles.done : ''} ${styles[`priority-${todo.priority}`]}`}
            >
              <div className={styles.checkboxWrapper}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={todo.isDone}
                    onChange={() => handleToggleTodo(todo.todoId, todo.isDone)}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.checkboxCustom}>
                    {todo.isDone && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                </label>
              </div>
              
              <div 
                className={styles.todoContent}
                onClick={() => handleTodoClick(todo)}
                style={{ cursor: todo.redirectUrl ? 'pointer' : 'default' }}
              >
                <div className={styles.todoHeader}>
                  <p className={styles.todoDescription}>{todo.description}</p>
                  <span 
                    className={`${styles.priorityBadge} ${styles[`priority-${todo.priority}`]}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    {todo.priority}
                  </span>
                </div>
                <div className={styles.todoMeta}>
                  {todo.dueDate && (
                    <span 
                      className={`${styles.dueDate} ${isOverdue(todo.dueDate) && !todo.isDone ? styles.overdue : ''}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(todo.dueDate)}
                    </span>
                  )}
                  <span className={styles.createdDate}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Added {new Date(todo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {todo.redirectUrl && (
                <button
                  className={styles.goButton}
                  onClick={() => handleTodoClick(todo)}
                  title="Go to task"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
