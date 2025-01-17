import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
  
},{timestamps:true});

export default mongoose.model('expense',expenseSchema)