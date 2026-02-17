import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import Todo from '../models/todo';
import { AuthRequest } from '../middleware/auth';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('TodoController');

/**
 * GET /api/todos
 * Get all todos for the authenticated user
 */
export const getTodos = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { userId, tenantId } = req.user!;
  const { status, limit = 50, skip = 0 } = req.query;

  logger.info(`[${requestId}] Getting todos`, { userId, tenantId, status });

  try {
    const query: any = { tenantId, userId };
    
    // Filter by status if provided
    if (status === 'pending') {
      query.isDone = false;
    } else if (status === 'completed') {
      query.isDone = true;
    }

    const todos = await Todo.find(query)
      .sort({ isDone: 1, createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .lean();

    const total = await Todo.countDocuments(query);

    logger.info(`[${requestId}] Retrieved todos`, {
      userId,
      tenantId,
      count: todos.length,
      total
    });

    return res.json({
      todos,
      total,
      hasMore: Number(skip) + todos.length < total
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error fetching todos`, {
      error: error.message,
      userId,
      tenantId
    });
    return res.status(500).json({ error: 'Failed to fetch todos' });
  }
};

/**
 * POST /api/todos
 * Create a new todo
 */
export const createTodo = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { userId, tenantId, roleName } = req.user!;
  const { userId: assignedUserId, description, projectId, eventId, dueDate, redirectUrl, priority } = req.body;

  logger.info(`[${requestId}] Creating todo`, { userId, tenantId, assignedUserId });

  try {
    // Admins can assign todos to anyone, others can only create for themselves
    const targetUserId = roleName === 'admin' ? (assignedUserId || userId) : userId;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const todo = new Todo({
      todoId: nanoid(),
      tenantId,
      userId: targetUserId,
      description,
      projectId,
      eventId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      redirectUrl,
      priority: priority || 'medium',
      isDone: false,
      addedBy: userId,
    });

    await todo.save();

    logger.info(`[${requestId}] Todo created`, {
      todoId: todo.todoId,
      tenantId,
      assignedTo: targetUserId
    });

    return res.status(201).json(todo);
  } catch (error: any) {
    logger.error(`[${requestId}] Error creating todo`, {
      error: error.message,
      userId,
      tenantId
    });
    return res.status(500).json({ error: 'Failed to create todo' });
  }
};

/**
 * PATCH /api/todos/:id
 * Update a todo (mark as done, update description, etc.)
 */
export const updateTodo = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { userId, tenantId } = req.user!;
  const { id } = req.params;
  const updates = req.body;

  logger.info(`[${requestId}] Updating todo`, { userId, tenantId, todoId: id });

  try {
    const todo = await Todo.findOne({ todoId: id, tenantId });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Only the assigned user or admin can update the todo
    if (todo.userId !== userId && req.user!.roleName !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this todo' });
    }

    // Apply updates
    if (updates.description !== undefined) todo.description = updates.description;
    if (updates.isDone !== undefined) todo.isDone = updates.isDone;
    if (updates.priority !== undefined) todo.priority = updates.priority;
    if (updates.dueDate !== undefined) todo.dueDate = updates.dueDate ? new Date(updates.dueDate) : undefined;
    if (updates.redirectUrl !== undefined) todo.redirectUrl = updates.redirectUrl;

    await todo.save();

    logger.info(`[${requestId}] Todo updated`, {
      todoId: id,
      tenantId,
      isDone: todo.isDone
    });

    return res.json(todo);
  } catch (error: any) {
    logger.error(`[${requestId}] Error updating todo`, {
      error: error.message,
      userId,
      tenantId,
      todoId: id
    });
    return res.status(500).json({ error: 'Failed to update todo' });
  }
};

/**
 * DELETE /api/todos/:id
 * Delete a todo
 */
export const deleteTodo = async (req: AuthRequest, res: Response) => {
  const requestId = nanoid(8);
  const { userId, tenantId, roleName } = req.user!;
  const { id } = req.params;

  logger.info(`[${requestId}] Deleting todo`, { userId, tenantId, todoId: id });

  try {
    const todo = await Todo.findOne({ todoId: id, tenantId });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Only the assigned user, creator, or admin can delete the todo
    if (todo.userId !== userId && todo.addedBy !== userId && roleName !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this todo' });
    }

    await Todo.deleteOne({ todoId: id, tenantId });

    logger.info(`[${requestId}] Todo deleted`, {
      todoId: id,
      tenantId
    });

    return res.json({ message: 'Todo deleted successfully' });
  } catch (error: any) {
    logger.error(`[${requestId}] Error deleting todo`, {
      error: error.message,
      userId,
      tenantId,
      todoId: id
    });
    return res.status(500).json({ error: 'Failed to delete todo' });
  }
};
