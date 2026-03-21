import axios from "axios";
import { CreateTaskPayload, Milestone, UpdateTaskPayload } from "../types";


const baseUrl = process.env.PLANNING_URL || 'http://localhost:3002';

export const getMilestonesByProjectId = async (projectId:string) =>{
    try {
        //http://localhost:3002/milestone/project/69bc6b4219254da8217aaadf
        const response = await axios.get(`${baseUrl}/milestone/project/${projectId}`);
        return Promise.resolve({status:response.status,data:response.data})
    } catch (error) {
        console.log('Error fetching milestones:', error);
        return Promise.reject(error);
    }
}


export const getTasksBYMilestoneId= async (milestoneId:string) =>{
    try{
        const response = await axios.get(`${baseUrl}/task/milestone/${milestoneId}`);
        return response.data;
    }catch(error){
        console.log('Error fetching tasks by milestone id:', error);
        return Promise.reject(error);
    }
}


export const createTask = async (task: CreateTaskPayload) => {
    try {
        console.log('Creating task with data');
        console.log(task);
        //http://localhost:3002/task/milestone/69bc78a30912805125e58f72
        const response = await axios.post(`${baseUrl}/task`,task);
        return Promise.resolve({ status: response.status, data: response.data });
    } catch (error) {
        console.log("Error creating task:", error);
        return Promise.reject(error);
    }
};

export const getTaskById = async (taskId: string) => {
    try {
        const response = await axios.get(`${baseUrl}/task/${taskId}`);
        return Promise.resolve({ status: response.status, data: response.data });
    } catch (error) {
        console.log("Error fetching task details:", error);
        return Promise.reject(error);
    }
};

export const updateTask = async (taskId: string, task: UpdateTaskPayload) => {
    try {
        const response = await axios.put(`${baseUrl}/task/${taskId}`, task);
        return Promise.resolve({ status: response.status, data: response.data });
    } catch (error) {
        console.log("Error updating task:", error);
        return Promise.reject(error);
    }
};



export const getMilestoneDetails=async (milestoneId:string) =>{
    try {
        const response = await axios.get(`${baseUrl}/milestone/${milestoneId}`);
        return Promise.resolve({status:response.status,data:response.data})
    }
        catch (error) {
        console.log('Error fetching milestone details:', error);
        return Promise.reject(error);
    }
}

export const updateMilestone = async (milestoneId:string,milestone:Milestone) =>{
    try {
        const response =await axios.patch(`${baseUrl}/milestone/${milestoneId}`,milestone);
        return Promise.resolve({status:response.status,data:response.data})

    } catch (error) {
        console.log('Error updating milestone:', error);
        return Promise.reject(error);
    }
}


export const deleteMilestone = async (milestoneId:string) =>{
    try {
        const response = await axios.delete(`${baseUrl}/milestone/${milestoneId}`);
        return Promise.resolve({status:response.status,data:response.data})
    } catch (error) {
        console.log('Error deleting milestone:', error);
        return Promise.reject(error);
    }
}

export const getAllMilestones = async () =>{
    try {
        const response = await axios.get(`${baseUrl}/milestone`);
        return Promise.resolve({status:response.status,data:response.data})
    } catch (error) {
        console.log('Error fetching milestones:', error);
        return Promise.reject(error);
    }
}

export const getMilestoneTasks = async (milestoneId:string) =>{
    try {
        const response = await axios.get(`${baseUrl}/milestone/${milestoneId}`);
        return Promise.resolve({status:response.status,data:response.data.tasks})
    } catch (error) {
        console.log('Error fetching milestone tasks:', error);
        return Promise.reject(error);
    }
}

export const getMilestoneProgress = async (milestoneId:string) =>{
    try {
        const response = await axios.get(`${baseUrl}/milestone/${milestoneId}`);
        return Promise.resolve({status:response.status,data:response.data.progress})
     }
        catch (error) {
        console.log('Error fetching milestone progress:', error);
        return Promise.reject(error);
     }
}

export const deleteTask = async (taskId:string) =>{
    try {
        const response = await axios.delete(`${baseUrl}/task/${taskId}`);
        return Promise.resolve({status:response.status,data:response.data})
    }

        catch (error) {
        console.log('Error deleting task:', error);
        return Promise.reject(error);
     }
}