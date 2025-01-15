import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
      },
      phone: {
        type: Number,
        required: true
      },
      loginId: {
        type: String,
        required: true
      },
      password: {
        type:String,
        required:true
      },
      is_blocked: {
        type: Boolean,
        default:false
      },
      passwordTries: {
        type: Number,
        default:0
      },
      
      
},{timestamps:true});

export default mongoose.model('user',userSchema)