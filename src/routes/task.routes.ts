import express from 'express';
import { getRepository } from 'typeorm';
import { Task } from '../entity/Task';
import { TaskAssignment } from '../entity/TaskAssignment';

const router = express.Router();

// VULNERABILITY: No proper authentication middleware
// VULNERABILITY: No input validation or sanitization

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const taskRepository = getRepository(Task);
    const tasks = await taskRepository.find();
    res.json(tasks);
  } catch (error) {
    // VULNERABILITY: Exposing detailed error information
    res.status(500).json({ error: 'Failed to fetch tasks', details: error });
  }
});

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const taskRepository = getRepository(Task);
    // VULNERABILITY: SQL Injection possible through direct parameter use
    const task = await taskRepository.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task', details: error });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const taskRepository = getRepository(Task);
    // VULNERABILITY: No data validation or sanitization
    const newTask = taskRepository.create(req.body);
    await taskRepository.save(newTask);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task', details: error });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const taskRepository = getRepository(Task);
    const task = await taskRepository.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // VULNERABILITY: Mass assignment vulnerability, no field validation
    taskRepository.merge(task, req.body);
    const updatedTask = await taskRepository.save(task);
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task', details: error });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const taskRepository = getRepository(Task);
    const task = await taskRepository.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await taskRepository.remove(task);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task', details: error });
  }
});

// Update task status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const taskRepository = getRepository(Task);
    const task = await taskRepository.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // VULNERABILITY: No validation on status values
    task.status = status;
    
    // VULNERABILITY: Automatically marking complete if status is 'Complete'
    if (status === 'Complete') {
      task.isCompleted = true;
    }
    
    await taskRepository.save(task);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task status', details: error });
  }
});

// Assign task to user
router.patch('/:id/assign', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const taskRepository = getRepository(Task);
    const task = await taskRepository.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // VULNERABILITY: No validation if the user exists
    // Create a task assignment in the assignment table instead
    const assignmentRepository = getRepository(TaskAssignment);
    
    // Remove any existing assignments for this task
    await assignmentRepository.delete({ taskId: task.id });
    
    // Create a new assignment
    await assignmentRepository.save({
      taskId: task.id,
      userId: userId
    });
    
    await taskRepository.save(task);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign task', details: error });
  }
});

export default router;