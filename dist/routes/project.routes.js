"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const typeorm_1 = require("typeorm");
const Project_1 = require("../entity/Project");
const Task_1 = require("../entity/Task");
const router = express_1.default.Router();
// VULNERABILITY: No proper authentication middleware
// VULNERABILITY: No input validation or sanitization
// Get all projects
router.get('/', async (req, res) => {
    try {
        const projectRepository = (0, typeorm_1.getRepository)(Project_1.Project);
        const projects = await projectRepository.find();
        res.json(projects);
    }
    catch (error) {
        // VULNERABILITY: Exposing detailed error information
        res.status(500).json({ error: 'Failed to fetch projects', details: error });
    }
});
// Get project by ID
router.get('/:id', async (req, res) => {
    try {
        const projectRepository = (0, typeorm_1.getRepository)(Project_1.Project);
        // VULNERABILITY: SQL Injection possible through direct parameter use
        const project = await projectRepository.findOne({ where: { id: parseInt(req.params.id) } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch project', details: error });
    }
});
// Create new project
router.post('/', async (req, res) => {
    try {
        const projectRepository = (0, typeorm_1.getRepository)(Project_1.Project);
        // VULNERABILITY: No data validation or sanitization
        const newProject = projectRepository.create(req.body);
        await projectRepository.save(newProject);
        res.status(201).json(newProject);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create project', details: error });
    }
});
// Update project
router.put('/:id', async (req, res) => {
    try {
        const projectRepository = (0, typeorm_1.getRepository)(Project_1.Project);
        const project = await projectRepository.findOne({ where: { id: parseInt(req.params.id) } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // VULNERABILITY: Mass assignment vulnerability, no field validation
        projectRepository.merge(project, req.body);
        const updatedProject = await projectRepository.save(project);
        res.json(updatedProject);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update project', details: error });
    }
});
// Delete project
router.delete('/:id', async (req, res) => {
    try {
        const projectRepository = (0, typeorm_1.getRepository)(Project_1.Project);
        const project = await projectRepository.findOne({ where: { id: parseInt(req.params.id) } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        await projectRepository.remove(project);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete project', details: error });
    }
});
// Get tasks for a project
router.get('/:id/tasks', async (req, res) => {
    try {
        const taskRepository = (0, typeorm_1.getRepository)(Task_1.Task);
        // VULNERABILITY: Direct query parameter use without validation
        const tasks = await taskRepository.find({ where: { projectId: parseInt(req.params.id) } });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks', details: error });
    }
});
// Create task for a project
router.post('/:id/tasks', async (req, res) => {
    try {
        const projectRepository = (0, typeorm_1.getRepository)(Project_1.Project);
        const project = await projectRepository.findOne({ where: { id: parseInt(req.params.id) } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const taskRepository = (0, typeorm_1.getRepository)(Task_1.Task);
        const newTask = taskRepository.create({
            ...req.body,
            projectId: parseInt(req.params.id)
        });
        await taskRepository.save(newTask);
        res.status(201).json(newTask);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create task', details: error });
    }
});
exports.default = router;
