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
      
      // 2. Add team member information
      if (project.teamMembers && project.teamMembers.length > 0) {
        // Convert to array if it's a string (from simple-array column type)
        const memberIds = Array.isArray(project.teamMembers) 
          ? project.teamMembers 
          : (project.teamMembers as string).split(',').map(id => parseInt(id.trim()));
        
        // Create team member details array
        const teamMembersDetails = [];
        
        // Fetch details for each team member (limit to 5 for performance in list view)
        const limitedMemberIds = memberIds.slice(0, 5);
        for (const memberId of limitedMemberIds) {
          if (!memberId) continue; // Skip invalid IDs
          
          const member = await userRepository.findOne({ where: { id: memberId } });
          if (member) {
            // Include only non-sensitive information
            teamMembersDetails.push({
              id: member.id,
              username: member.username,
              department: member.department,
              jobTitle: member.jobTitle
            });
          }
        }
        
        // Add count of additional members not shown
        const additionalCount = Math.max(0, memberIds.length - 5);
        
        // Replace the IDs array with the detailed information
        project.teamMembersDetails = teamMembersDetails;
        project.teamMembersCount = memberIds.length;
        project.additionalMembersCount = additionalCount;
      } else {
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
    
    // 2. Add team member information
    if (project.teamMembers && project.teamMembers.length > 0) {
      // Convert to array if it's a string (from simple-array column type)
      const memberIds = Array.isArray(project.teamMembers) 
        ? project.teamMembers 
        : (project.teamMembers as string).split(',').map(id => parseInt(id.trim()));
      
      // Create team member details array
      const teamMembersDetails = [];
      
      // Fetch details for each team member
      for (const memberId of memberIds) {
        if (!memberId) continue; // Skip invalid IDs
        
        const member = await userRepository.findOne({ where: { id: memberId } });
        if (member) {
          // Include only non-sensitive information
          teamMembersDetails.push({
            id: member.id,
            username: member.username,
            department: member.department,
            jobTitle: member.jobTitle
          });
        }
      }
      
      // Replace the IDs array with the detailed information
      project.teamMembersDetails = teamMembersDetails;
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
    
    // 2. Team member information
    if (savedProject.teamMembers && savedProject.teamMembers.length > 0) {
      // Convert to array if it's a string (from simple-array column type)
      const memberIds = Array.isArray(savedProject.teamMembers) 
        ? savedProject.teamMembers 
        : (savedProject.teamMembers as string).split(',').map(id => parseInt(id.trim()));
      
      // Create team member details array
      const teamMembersDetails = [];
      
      // Fetch details for each team member
      for (const memberId of memberIds) {
        if (!memberId) continue; // Skip invalid IDs
        
        const member = await userRepository.findOne({ where: { id: memberId } });
        if (member) {
          // Include only non-sensitive information
          teamMembersDetails.push({
            id: member.id,
            username: member.username,
            department: member.department,
            jobTitle: member.jobTitle
          });
        }
      }
      
      // Replace the IDs array with the detailed information
      savedProject.teamMembersDetails = teamMembersDetails;
    }
    
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
    
    // 2. Add team member information
    if (updatedProject.teamMembers && updatedProject.teamMembers.length > 0) {
      // Convert to array if it's a string (from simple-array column type)
      const memberIds = Array.isArray(updatedProject.teamMembers) 
        ? updatedProject.teamMembers 
        : (updatedProject.teamMembers as string).split(',').map(id => parseInt(id.trim()));
      
      // Create team member details array
      const teamMembersDetails = [];
      
      // Fetch details for each team member
      for (const memberId of memberIds) {
        if (!memberId) continue; // Skip invalid IDs
        
        const member = await userRepository.findOne({ where: { id: memberId } });
        if (member) {
          // Include only non-sensitive information
          teamMembersDetails.push({
            id: member.id,
            username: member.username,
            department: member.department,
            jobTitle: member.jobTitle
          });
        }
      }
      
      // Replace the IDs array with the detailed information
      updatedProject.teamMembersDetails = teamMembersDetails;
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