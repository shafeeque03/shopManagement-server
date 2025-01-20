import express from 'express';
import { userLogin,getProducts, saveBill, fetchUserBills,addExpense } from '../controller/userController.js';
const userRoute = express();


userRoute.post('/login',userLogin)
userRoute.get('/products/search',getProducts)
userRoute.post('/saveBill',saveBill)
userRoute.get('/billHistory/:userId',fetchUserBills)
userRoute.post('/addExpense',addExpense)
export default userRoute