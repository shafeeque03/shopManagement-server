import jwt from 'jsonwebtoken';
import userModel from '../model/userModel.js';
import bcrypt from 'bcrypt'

export const userHome = async(req,res)=>{
    try {
        const msg = 'Welcome to home';
        res.status(200).json({msg})
    } catch (error) {
        console.error(error.message);
    res.status(500).json({ message: "Server error" });
    }
}

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
