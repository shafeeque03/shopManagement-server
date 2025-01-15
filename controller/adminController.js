import jwt from "jsonwebtoken";
import userModel from "../model/userModel.js";
import bcrypt from "bcrypt";

export const adminHome = async (req, res) => {
  try {
    const msg = "Welcome to admin home";
    res.status(200).json({ msg });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const adminLogin = async (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASS;
  const adminName = "admin";
  try {
    const { email, password } = req.body;
    // console.log(email, password, "email and passowrd vrooo")
    if (adminEmail === email) {
      if (adminPassword === password) {
        // console.log("something fishy password")
        const token = jwt.sign(
          {
            name: adminName,
            email: adminEmail,
            role: "admin",
          },
          process.env.ADMIN_SECRET,
          {
            expiresIn: "12h",
          }
        );
        res
          .status(200)
          .json({ adminName, token, message: `Welome ${adminName}` });
      } else {
        res.status(403).json({ message: "Incorrect Password" });
      }
    } else {
      res.status(401).json({ message: "Incorrect email" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

export const addUser = async (req, res) => {
  try {
    const { values } = req.body;
    const exist = await userModel.findOne({ loginId: values.loginId });
    if (exist) {
      return res.status(400).json({ message: "user already exist" });
    }

    const encryptedPassword = await securePassword(values.password);
    const newUser = await userModel.create({
      name: values.name,
      loginId: values.loginId,
      password: encryptedPassword,
      phone: values.phone,
    });
    await newUser.save();

    res.status(201).json({ message: "User added successfully", newUser });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const fetchAllUsers = async (req, res) => {
  try {
    const data = await userModel.find({});
    res.status(200).json(data)
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
