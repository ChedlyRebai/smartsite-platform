import axios from "axios";

const baseUrl=process.env.PLANNING_URL || 'http://localhost:3001/api/planning';

export const getMilestonesByProjectId = async (projectId:string) =>{
    try {
        const response = await axios.get(`${baseUrl}`)
    } catch (error) {
        
    }
}