import express from "express";
import {
  addUser,
  adminLogin,
  fetchAllUsers,
  fetchAllInvoices,
  fetchDashData,
  getSalesReport,
  downloadSalesReport,
  updateUserPass,
  updateUser,
  fetchAllExpenses
} from "../controller/adminController.js";
import {
  addProduct,
  fetchAllProducts,
  editProduct,
} from "../controller/productController.js";
const adminRoute = express();

adminRoute.post("/login", adminLogin);
adminRoute.post("/addUser", addUser);
adminRoute.put("/updateUserData", updateUser);
adminRoute.post("/updatePassword", updateUserPass);
adminRoute.get("/fetchUsers", fetchAllUsers);

adminRoute.get("/fetchProducts", fetchAllProducts);
adminRoute.post("/addProduct", addProduct);
adminRoute.post("/editProduct", editProduct);

adminRoute.get("/fetchAllInvoices", fetchAllInvoices);

adminRoute.get("/fetchDashboard", fetchDashData);

adminRoute.get("/fetchExpenses", fetchAllExpenses);

adminRoute.get("/reports/sales", getSalesReport);
adminRoute.get("/reports/download", downloadSalesReport);
export default adminRoute;
