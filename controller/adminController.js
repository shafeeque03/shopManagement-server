import jwt from "jsonwebtoken";
import userModel from "../model/userModel.js";
import bcrypt from "bcrypt";
import billModel from "../model/billModel.js";
import expenseModel from "../model/expenseModel.js";
import pdf from "html-pdf";


export const fetchDashData = async (req, res) => {
  try {
    // Get current date and first day of current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const last7Days = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const dailySales = await billModel.aggregate([
      { 
        $match: { 
          createdAt: { $gte: last7Days } 
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
          },
          total: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Create an array of last 7 days with 0 sales for days without data
    const last7DaysData = [];
    for(let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const existingData = dailySales.find(d => d._id === dateString);
      last7DaysData.push({
        date: dateString,
        total: existingData ? existingData.total : 0,
        count: existingData ? existingData.count : 0
      });
    }

    // Fetch total sales amount
    const totalSales = await billModel.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);

    // Fetch monthly sales
    const monthlySales = await billModel.aggregate([
      { $match: { createdAt: { $gte: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);

    // Get total bills count
    const totalBills = await billModel.countDocuments();

    // Get today's bills
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayBills = await billModel.countDocuments({
      createdAt: { $gte: todayStart }
    });

    // Get total expenses
    const totalExpenses = await expenseModel.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Get monthly expenses
    const monthlyExpenses = await expenseModel.aggregate([
      { $match: { createdAt: { $gte: firstDayOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Get payment method distribution
    const paymentMethods = await billModel.aggregate([
      { $group: { 
        _id: "$paymentMethod", 
        count: { $sum: 1 },
        total: { $sum: "$total" }
      }}
    ]);

    const dashboardData = {
      totalSales: totalSales[0]?.total || 0,
      monthlySales: monthlySales[0]?.total || 0,
      totalBills,
      todayBills,
      totalExpenses: totalExpenses[0]?.total || 0,
      monthlyExpenses: monthlyExpenses[0]?.total || 0,
      paymentMethods,
      last7DaysData
    };

    res.status(200).json({dashboardData});
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
      phone: Number(values.phone),
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
    res.status(200).json(data);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const fetchAllInvoices = async (req, res) => {
  try {
      const { page = 1, search = "" } = req.query;
      const limit = 50;
      const skip = (page - 1) * limit;


      const query = {};

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



export const getSalesReport = async (req, res) => {
  try {
    // Fetch last 20 sales
    const recentSales = await billModel.aggregate([
      {
        $project: {
          billNumber: 1,
          total: 1,
          subTotal: 1,
          taxAmount: 1,
          discount: 1,
          paymentMethod: 1,
          createdAt: 1,
          'createdBy.name': 1,
          products: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Fetch all sales for summary statistics
    const allSales = await billModel.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
          totalBills: { $sum: 1 },
          totalTax: { $sum: "$taxAmount" },
          totalDiscount: { $sum: "$discount" }
        }
      }
    ]);

    const summary = allSales[0] ? {
      totalSales: allSales[0].totalSales,
      totalBills: allSales[0].totalBills,
      averageBillValue: allSales[0].totalSales / allSales[0].totalBills,
      totalTax: allSales[0].totalTax,
      totalDiscount: allSales[0].totalDiscount
    } : {
      totalSales: 0,
      totalBills: 0,
      averageBillValue: 0,
      totalTax: 0,
      totalDiscount: 0
    };

    // Payment method breakdown
    const paymentMethodStats = await billModel.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$total" },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      salesData: recentSales,
      summary,
      paymentMethodStats
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const downloadSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);
    
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    const quotations = await billModel.find({
      createdAt: {
        $gte: startDateTime,
        $lte: endDateTime,
      },
    }).sort({ createdAt: -1 });

    // Calculate total revenue
    const totalRevenue = quotations.reduce((sum, q) => sum + q.total, 0);

    // Generate HTML for PDF
    const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      /* Modern CSS Reset */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      /* Base Styles */
      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        padding: 40px;
        background-color: #fff;
      }

      /* Header Section */
      .header {
        margin-bottom: 40px;
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 20px;
      }

      .header h1 {
        color: #2563eb;
        font-size: 28px;
        font-weight: 600;
        margin-bottom: 10px;
      }

      .date-range {
        color: #64748b;
        font-size: 14px;
        font-weight: 500;
      }

      /* Table Styles */
      .table-container {
        margin: 30px 0;
        width: 100%;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        background-color: #fff;
      }

      th {
        background-color: #f8fafc;
        color: #334155;
        font-weight: 600;
        text-align: left;
        padding: 12px;
        border-bottom: 2px solid #e2e8f0;
        font-size: 14px;
      }

      td {
        padding: 12px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 14px;
        color: #475569;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:nth-child(even) {
        background-color: #f8fafc;
      }

      /* Summary Section */
      .summary {
        margin-top: 40px;
        background-color: #f8fafc;
        padding: 20px;
        border: 1px solid #e2e8f0;
      }

      .summary-title {
        font-size: 18px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 15px;
      }

      .summary-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 20px;
      }

      .summary-item {
        flex: 1;
        min-width: 200px;
        background-color: #fff;
        padding: 15px;
        border: 1px solid #e2e8f0;
      }

      .summary-label {
        font-size: 13px;
        color: #64748b;
        margin-bottom: 5px;
      }

      .summary-value {
        font-size: 20px;
        font-weight: 600;
        color: #2563eb;
      }

      /* Footer */
      .footer {
        margin-top: 40px;
        text-align: center;
        color: #64748b;
        font-size: 12px;
        border-top: 1px solid #e2e8f0;
        padding-top: 20px;
      }

      @page {
        margin: 20mm;
      }

      @media print {
        body {
          padding: 0;
        }

        .table-container {
          page-break-inside: avoid;
        }

        table {
          font-size: 12px;
        }

        .summary {
          page-break-inside: avoid;
        }
      }
    </style>
  </head>

      <body>
        <div class="header">
          <h1>Sales Report</h1>
          <div class="date-range">
            <strong>Report Period:</strong> ${startDate} to ${endDate}
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Bill No</th>
                <th>Created By</th>
                <th>Sub Total</th>
                <th>Tax</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Payment Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${quotations.map(bill => `
                <tr>
                  <td>${bill.billNumber}</td>
                  <td>${bill.createdBy?.name || 'N/A'}</td>
                  <td>$${bill.subTotal?.toFixed(2)}</td>
                  <td>$${bill.taxAmount?.toFixed(2)}</td>
                  <td>$${bill.discount?.toFixed(2)}</td>
                  <td>$${bill.total?.toFixed(2)}</td>
                  <td>${bill.paymentMethod}</td>
                  <td>${bill.createdAt.toISOString().split('T')[0]}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="summary">
          <div class="summary-title">Report Summary</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Total Bills</div>
              <div class="summary-value">${quotations.length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Revenue</div>
              <div class="summary-value">$${totalRevenue.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Average Bill Value</div>
              <div class="summary-value">$${(totalRevenue / quotations.length).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          Generated on ${new Date().toLocaleDateString()} - This is a system-generated report
        </div>
      </body>
      </html>
    `;

    // PDF generation options
    const options = {
      format: "A4",
      orientation: "portrait",
      border: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    };

    // Generate PDF
    pdf.create(htmlContent, options).toBuffer((err, buffer) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error generating PDF",
          error: err.message,
        });
      }

      // Send PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=sales_${startDate}_to_${endDate}.pdf`
      );
      res.send(buffer);
    });
  } catch (error) {
    console.error("Download Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const updateUserPass = async(req,res)=>{
  try {
   const {userId,newPass} = req.body;
   if(!userId||!newPass){
    return res.status(400).json({message:"userId or password missing"})
   }
   const user = await userModel.findById(userId);
   if(!user){
    return res.status(404).json({message:"User not Found"});
   }
   const encryptedPassword = await securePassword(newPass);
   user.password = encryptedPassword;
   await user.save();
   res.status(200).json({message:`${user.name} Password Updated`})

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
}

export const updateUser = async(req,res)=>{
  try {
    const {userId, values} = req.body;
    if(!userId || !values){
      return res.status(400).json({message:"User ID or update values missing"})
    }
    
    const user = await userModel.findById(userId);
    if(!user){
      return res.status(404).json({message:"User not Found"});
    }

    // Update user with provided values
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: values.name,
          phone: values.phone,
          loginId: values.loginId,
          is_blocked: values.is_blocked
        }
      },
      { new: true }
    );

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const fetchAllExpenses = async(req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalExpenses = await expenseModel.countDocuments({});
    
    // Fetch paginated expenses
    const expenses = await expenseModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      expenses,
      currentPage: page,
      totalPages: Math.ceil(totalExpenses / limit),
      totalExpenses
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
