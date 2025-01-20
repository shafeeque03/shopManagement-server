import jwt from 'jsonwebtoken';
import userModel from '../model/userModel.js';
import bcrypt from 'bcrypt'
import expenseModel from '../model/expenseModel.js';
import productModel from '../model/productModel.js';
import billModel from '../model/billModel.js';

export const saveBill = async (req, res) => {
  try {
    const { value } = req.body;
    const invoiceNum = await billModel.countDocuments() + 1000;

    if (!value || !value.products || value.products.length === 0) {
      return res.status(400).json({ message: 'All value and products are required' });
    }

    // Update stock for each product
    for (const product of value.products) {
      const { productId, quantity } = product;

      if (!productId || !quantity) {
        return res.status(400).json({ message: 'Product ID and quantity are required for all products' });
      }

      const existingProduct = await productModel.findById(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: `Product with ID ${productId} not found` });
      }

      // Deduct the stock
      existingProduct.stock -= quantity;
      await existingProduct.save();
    }

    // Create a new bill
    const newBill = await billModel.create({
      billNumber: invoiceNum,
      ...value,
    });

    await newBill.save();

    // Return the created bill
    return res.status(200).json({
      message: "Bill Saved",
      bill: newBill,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


export const userLogin = async (req, res) => {
  try {
    const{loginId,password} = req.body
    const user = await userModel.findOne({ loginId: loginId });
    if(!user) {
      return res.status(401).json({message:"User not registered"})
    }
      if(user.is_blocked == false){
        const correctPassword = await bcrypt.compare(password, user.password)
        if(correctPassword) {
          const token = jwt.sign(
            {name: user.name, loginId:user.loginId, id:user._id,role: "user"},
            process.env.USER_SECRET,
            {
              expiresIn: "12h",
            }
          );
          res.status(200).json({ user, token, message: `Welome ${user.name}` });
        }else{
          return res.status(403).json({ message: "Incorrect password" });
        }
      }else{
        return res.status(403).json({ message: "User is blocked" });
      }
 
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { search } = req.query;
    // Build the query condition
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } }, // Case-insensitive search in name
            { code: { $regex: search, $options: "i" } }, // Case-insensitive search in code
          ],
        }
      : {};

    // Fetch products based on the query
    const products = await productModel.find(query);

    return res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



export const fetchUserBills = async (req, res) => {
  try {
      const { userId } = req.params;
      const { page = 1, search = "" } = req.query;
      const limit = 50;
      const skip = (page - 1) * limit;

      if (!userId) {
          return res.status(400).json({ message: "userId required" });
      }

      const query = {
          'createdBy.id': userId
      };

      // Add search conditions if search query exists
      if (search) {
        query.billNumber = { $regex: search, $options: 'i' };
    }
    

      const [bills, total] = await Promise.all([
          billModel
              .find(query)
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit),
          billModel.countDocuments(query)
      ]);

      res.status(200).json({
          bills,
          total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit)
      });
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ status: "Internal Server Error" });
  }
};

export const addExpense = async(req,res)=>{
  try {
    const{name,amount} = req.body;
    if(!name || !amount){
      return res.status(400).json({message:"Please fill all fields"})
    }

    const newExpense = await expenseModel.create({
      name,
      amount
    });
    await newExpense.save();
    res.status(200).json({message:"Expense Added"})
    
  } catch (error) {
    console.log(error.message);
      res.status(500).json({ status: "Internal Server Error" });
  }
}

