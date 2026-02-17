import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { todoApi, teamApi } from '../../services/api';
import { Select } from '../../components/ui/Select';
import { Modal, Button, Input, DatePicker, Pagination } from '../../components/ui';
import { PageHeader } from '../../components/help/index.js';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import styles from './Todos.module.css';
import pageStyles from '../Page.module.css';

interface Todo {
  todoId: string;
  description: string;
  isDone: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  redirectUrl?: string;
  createdAt: string;
  projectId?: string;
  eventId?: string;
}

const Todos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    description: '',
    assignedTo: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    redirectUrl: ''
  });
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchTodos();
    fetchTeamMembers();
  }, [filter]);

  const fetchTeamMembers = async () => {
    try {
      const response = await teamApi.getAll();
      setTeamMembers(response.teamMembers || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const params = filter === 'all' ? {} : { status: filter, limit: 100 };
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

  const handleCreateTask = () => {
    setShowCreateModal(true);
    setFormData({
      description: '',
      assignedTo: user?.userId || '',
      priority: 'medium',
      dueDate: '',
      redirectUrl: ''
    });
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setFormData({
      description: '',
      assignedTo: '',
      priority: 'medium',
      dueDate: '',
      redirectUrl: ''
    });
  };

  const handleSubmitTask = async () => {
    if (!formData.description.trim()) {
      showToast('error', 'Please enter a task description');
      return;
    }
    if (!formData.assignedTo) {
      showToast('error', 'Please select who to assign this task to');
      return;
    }

    try {
      await todoApi.create({
        description: formData.description,
        userId: formData.assignedTo,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        redirectUrl: formData.redirectUrl || undefined
      });
      showToast('success', 'Task created successfully');
      handleCloseModal();
      fetchTodos();
    } catch (error: any) {
      console.error('Error creating task:', error);
      showToast('error', error.message || 'Failed to create task');
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const filteredTodos = todos.filter(todo => {
    if (priorityFilter !== 'all' && todo.priority !== priorityFilter) return false;
    if (searchQuery && !todo.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTodos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTodos = filteredTodos.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, priorityFilter, searchQuery]);

  const stats = {
    total: todos.length,
    pending: todos.filter(t => !t.isDone).length,
    completed: todos.filter(t => t.isDone).length,
    highPriority: todos.filter(t => t.priority === 'high' && !t.isDone).length,
  };

  const filterOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'all', label: 'All' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  return (
    <div className={pageStyles.pageContainer}>
      <PageHeader onHelpClick={() => {}} />

      {/* Main Content */}
      <div className={styles.content}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.searchContainer}>
            <svg className={styles.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={styles.clearButton}
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

            <div className={styles.filters}>
              <Select
                value={filter}
                onChange={(value) => setFilter(value as any)}
                options={filterOptions}
                placeholder="Status"
                className={styles.filterSelect}
              />
              <Select
                value={priorityFilter}
                onChange={setPriorityFilter}
                options={priorityOptions}
                placeholder="Priority"
                className={styles.filterSelect}
              />
            </div>
          </div>

          <Button onClick={handleCreateTask}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </Button>
        </div>

        {/* Todos List */}
        <div className={styles.todosContainer}>
          {loading ? (
            <div className={styles.loading}>Loading tasks...</div>
          ) : filteredTodos.length === 0 ? (
            <div className={styles.emptyState}>
              <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3>No tasks found</h3>
              <p>Try adjusting your filters or create a new task</p>
            </div>
          ) : (
            <>
              <div className={styles.todosList}>
                {currentTodos.map((todo) => (
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
                      <p className={styles.todoDescription}>
                        {todo.description}
                        <span className={`${styles.priorityBadge} ${styles[`priority-${todo.priority}`]}`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                          {todo.priority}
                        </span>
                      </p>
                    </div>
                    <div className={styles.todoMeta}>
                      {todo.dueDate && (
                        <span className={`${styles.metaItem} ${isOverdue(todo.dueDate) && !todo.isDone ? styles.overdue : ''}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Due: {formatDate(todo.dueDate)}
                        </span>
                      )}
                      <span className={styles.metaItem}>
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
              ))}
              </div>

              {/* Pagination Controls */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTodos.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        title="Create New Task"
        size="medium"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input
            label="Task Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter task description..."
            required
          />

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Assign To
            </label>
            <Select
              value={formData.assignedTo}
              onChange={(value) => setFormData({ ...formData, assignedTo: value })}
              options={[
                { value: user?.userId || '', label: 'Myself' },
                ...teamMembers.map(member => ({
                  value: member.userId,
                  label: `${member.firstName} ${member.lastName}`
                }))
              ]}
              placeholder="Select assignee"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Priority
            </label>
            <Select
              value={formData.priority}
              onChange={(value) => setFormData({ ...formData, priority: value as any })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
              ]}
              placeholder="Select priority"
            />
          </div>

          <DatePicker
            label="Due Date"
            value={formData.dueDate}
            onChange={(value) => setFormData({ ...formData, dueDate: value })}
            placeholder="Select due date"
            allowPast={false}
          />

          <Input
            label="Redirect URL (optional)"
            value={formData.redirectUrl}
            onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
            placeholder="e.g., /projects/123"
          />

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTask}>
              Create Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Todos;
