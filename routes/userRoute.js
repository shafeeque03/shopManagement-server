import express from 'express';
import { userHome,userLogin,getProducts, saveBill } from '../controller/userController.js';
const userRoute = express();


userRoute.get('/',userHome)
userRoute.post('/login',userLogin)
userRoute.get('/products/search',getProducts)
userRoute.post('/saveBill',saveBill)
export default userRoute