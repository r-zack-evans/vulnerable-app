import express from 'express';
import { getRepository } from 'typeorm';
import { Project } from '../entity/Project';
import { Task } from '../entity/Task';
import { User } from '../entity/User';

const router = express.Router();

// VULNERABILITY: No proper authentication middleware
// VULNERABILITY: No input validation or sanitization

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projectRepository = getRepository(Project);
    const userRepository = getRepository(User);
    const projects = await projectRepository.find();
    
    // Enhance projects with user information
    for (const project of projects) {
      // 1. Add owner information
      if (project.ownerId) {
        const owner = await userRepository.findOne({ where: { id: project.ownerId } });
        if (owner) {
          project.ownerName = owner.username;
          project.ownerRole = owner.role;
          project.ownerDepartment = owner.department;
        }
      }
      
      // 2. Get team members from task assignments instead
      try {
        // Look up team members through task assignments
        const taskRepository = getRepository(Task);
        const tasks = await taskRepository.find({ where: { projectId: project.id } });
        
        // Get unique user IDs from tasks
        const uniqueUserIds = new Set<number>();
        const taskAssignments = await getRepository('task_assignment')
          .createQueryBuilder('ta')
          .where('ta.taskId IN (:...taskIds)', { taskIds: tasks.map(t => t.id) })
          .leftJoinAndSelect('ta.user', 'user')
          .getMany();
        
        // Extract user information
        const teamMembersDetails = [];
        for (const assignment of taskAssignments) {
          if (assignment.user && !uniqueUserIds.has(assignment.user.id)) {
            uniqueUserIds.add(assignment.user.id);
            teamMembersDetails.push({
              id: assignment.user.id,
              username: assignment.user.username,
              department: assignment.user.department,
              jobTitle: assignment.user.jobTitle
            });
          }
        }
        
        // Only show up to 5 team members in list view
        const limitedMembersDetails = teamMembersDetails.slice(0, 5);
        const additionalCount = Math.max(0, teamMembersDetails.length - 5);
        
        // Add team member information to project
        project.teamMembersDetails = limitedMembersDetails;
        project.teamMembersCount = teamMembersDetails.length;
        project.additionalMembersCount = additionalCount;
      } catch (error) {
        console.error(`Error fetching team members for project ${project.id}:`, error);
        project.teamMembersDetails = [];
        project.teamMembersCount = 0;
        project.additionalMembersCount = 0;
      }
    }
    
    res.json(projects);
  } catch (error) {
    // VULNERABILITY: Exposing detailed error information
    res.status(500).json({ error: 'Failed to fetch projects', details: error });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const projectRepository = getRepository(Project);
    const userRepository = getRepository(User);
    
    // VULNERABILITY: SQL Injection possible through direct parameter use
    const project = await projectRepository.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Enhance project with user information
    // 1. Add owner information
    if (project.ownerId) {
      const owner = await userRepository.findOne({ where: { id: project.ownerId } });
      if (owner) {
        // Add owner information directly to the project object
        project.ownerName = owner.username;
        project.ownerRole = owner.role;
        project.ownerDepartment = owner.department;
      }
    }
    
    // 2. Get team members from task assignments
    try {
      // Look up team members through task assignments
      const taskRepository = getRepository(Task);
      const tasks = await taskRepository.find({ where: { projectId: project.id } });
      
      // Get unique user IDs from tasks
      const uniqueUserIds = new Set<number>();
      const taskAssignments = await getRepository('task_assignment')
        .createQueryBuilder('ta')
        .where('ta.taskId IN (:...taskIds)', { taskIds: tasks.map(t => t.id) })
        .leftJoinAndSelect('ta.user', 'user')
        .getMany();
      
      // Extract user information
      const teamMembersDetails = [];
      for (const assignment of taskAssignments) {
        if (assignment.user && !uniqueUserIds.has(assignment.user.id)) {
          uniqueUserIds.add(assignment.user.id);
          teamMembersDetails.push({
            id: assignment.user.id,
            username: assignment.user.username,
            department: assignment.user.department,
            jobTitle: assignment.user.jobTitle
          });
        }
      }
      
      // Add team member information to project
      project.teamMembersDetails = teamMembersDetails;
    } catch (error) {
      console.error(`Error fetching team members for project ${project.id}:`, error);
      project.teamMembersDetails = [];
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project', details: error });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const projectRepository = getRepository(Project);
    const userRepository = getRepository(User);
    // VULNERABILITY: No data validation or sanitization
    // Create a new project instance directly
    const newProject = new Project();
    Object.assign(newProject, req.body);
    
    // Save the new project
    const savedProject = await projectRepository.save(newProject);
    
    // Add user information to the response
    // 1. Owner information
    if (savedProject.ownerId) {
      const owner = await userRepository.findOne({ where: { id: savedProject.ownerId } });
      if (owner) {
        savedProject.ownerName = owner.username;
        savedProject.ownerRole = owner.role;
        savedProject.ownerDepartment = owner.department;
      }
    }
    
    // New projects won't have team members yet since they need to be associated via tasks
    savedProject.teamMembersDetails = [];
    
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project', details: error });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const projectRepository = getRepository(Project);
    const userRepository = getRepository(User);
    const project = await projectRepository.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // VULNERABILITY: Mass assignment vulnerability, no field validation
    projectRepository.merge(project, req.body);
    const updatedProject = await projectRepository.save(project);
    
    // Enhance response with user information
    // 1. Add owner information
    if (updatedProject.ownerId) {
      const owner = await userRepository.findOne({ where: { id: updatedProject.ownerId } });
      if (owner) {
        updatedProject.ownerName = owner.username;
        updatedProject.ownerRole = owner.role;
        updatedProject.ownerDepartment = owner.department;
      }
    }
    
    // 2. Get team members from task assignments
    try {
      // Look up team members through task assignments
      const taskRepository = getRepository(Task);
      const tasks = await taskRepository.find({ where: { projectId: updatedProject.id } });
      
      // Get unique user IDs from tasks
      const uniqueUserIds = new Set<number>();
      const taskAssignments = await getRepository('task_assignment')
        .createQueryBuilder('ta')
        .where('ta.taskId IN (:...taskIds)', { taskIds: tasks.map(t => t.id) })
        .leftJoinAndSelect('ta.user', 'user')
        .getMany();
      
      // Extract user information
      const teamMembersDetails = [];
      for (const assignment of taskAssignments) {
        if (assignment.user && !uniqueUserIds.has(assignment.user.id)) {
          uniqueUserIds.add(assignment.user.id);
          teamMembersDetails.push({
            id: assignment.user.id,
            username: assignment.user.username,
            department: assignment.user.department,
            jobTitle: assignment.user.jobTitle
          });
        }
      }
      
      // Add team member information to project
      updatedProject.teamMembersDetails = teamMembersDetails;
    } catch (error) {
      console.error(`Error fetching team members for project ${updatedProject.id}:`, error);
      updatedProject.teamMembersDetails = [];
    }
    
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project', details: error });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const projectRepository = getRepository(Project);
    const project = await projectRepository.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await projectRepository.remove(project);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project', details: error });
  }
});

// Get tasks for a project
router.get('/:id/tasks', async (req, res) => {
  try {
    const taskRepository = getRepository(Task);
    // VULNERABILITY: Direct query parameter use without validation
    const tasks = await taskRepository.find({ where: { projectId: parseInt(req.params.id) } });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: error });
  }
});

// Create task for a project
router.post('/:id/tasks', async (req, res) => {
  try {
    const projectRepository = getRepository(Project);
    const project = await projectRepository.findOne({ where: { id: parseInt(req.params.id) } });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const taskRepository = getRepository(Task);
    const newTask = taskRepository.create({
      ...req.body,
      projectId: parseInt(req.params.id)
    });
    
    await taskRepository.save(newTask);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task', details: error });
  }
});

export default router;