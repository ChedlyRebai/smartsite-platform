import { AuthState } from './../types/index';
import { NotificationApi } from "@/lib/api-client"
import axios from "axios";
import { useAuthStore } from '../store/authStore';



export const getMyNotifications= async ()=>{
    const {data} = await NotificationApi.get('/mynotifications')
    return data;
}

export const getUnreadNotifications= async ()=>{
    const token = useAuthStore.getState().user.access_token;
    const {data} = await axios.get('http://localhost:3004/notification/unread',{
        headers: {
            Authorization: `Bearer ${token}`,
        }
    })

    console.log("data unread================================",data);
    return data || [] as Notification[];
}

export const getReadNotifications= async ()=>{
    const {data} = await NotificationApi.get('/read')
    return data || [] as Notification[];
}

export const getUnreadNotificationCount= async ()=>{
    const {data} = await NotificationApi.get('/unread-count')
    return data;
}