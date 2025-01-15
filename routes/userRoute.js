import express from 'express';
import { userHome,userLogin } from '../controller/userController.js';
const userRoute = express();


userRoute.get('/',userHome)
userRoute.post('/login',userLogin)
export default userRoute