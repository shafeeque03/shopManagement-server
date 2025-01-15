import express from 'express';
import { addUser, adminHome,adminLogin,fetchAllUsers } from '../controller/adminController.js';
const adminRoute = express();

adminRoute.get('/',adminHome)
adminRoute.post('/login',adminLogin)
adminRoute.post('/addUser',addUser)
adminRoute.get('/fetchUsers',fetchAllUsers)
export default adminRoute
