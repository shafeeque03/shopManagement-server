import express from 'express';
import { addUser, adminHome,adminLogin,fetchAllUsers } from '../controller/adminController.js';
import { addProduct, fetchAllProducts, editProduct } from '../controller/productController.js';
const adminRoute = express();

adminRoute.get('/',adminHome)
adminRoute.post('/login',adminLogin)
adminRoute.post('/addUser',addUser)
adminRoute.get('/fetchUsers',fetchAllUsers)

adminRoute.get('/fetchProducts',fetchAllProducts)
adminRoute.post('/addProduct',addProduct)
adminRoute.post('/editProduct',editProduct)


export default adminRoute
