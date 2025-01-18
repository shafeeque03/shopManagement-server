import productModel from "../model/productModel.js";

export const addProduct = async (req, res) => {
  try {
    const {formData} = req.body;
    if(!formData.name||!formData.price||!formData.stock){
        return res.status(400).json({message:"Fill all fields"})
    }
    const newProduct = await productModel.create({
        code:formData.code,
        name:formData.name,
        price:parseInt(formData.price),
        stock:parseInt(formData.stock)
    });
    await newProduct.save();
    res.status(201).json({newProduct,message:"New Product Added"})
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const editProduct = async (req, res) => {
  try {
    const {pid,formData} = req.body;
    if(!formData.name||!formData.price||!formData.stock||!pid){
        return res.status(400).json({message:"Fill all fields"})
    }
    const product = await productModel.findById(pid);
    if(!product){
        return res.status(404).json({message:"product not found"})
    }

    product.name = formData.name
    product.price = parseInt(formData.price)
    product.stock = parseInt(formData.stock)
    product.code = formData.code
    await product.save()
    res.status(201).json({product,message:"New Product Added"})
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

// Backend - Controller
export const fetchAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;
        
        // Create search query
        const searchQuery = search 
            ? { name: { $regex: search, $options: 'i' } }
            : {};
            
        // Get total count for pagination
        const totalProducts = await productModel.countDocuments(searchQuery);
        
        // Fetch products with pagination and search
        const allProducts = await productModel.find(searchQuery)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
            
        res.status(200).json({
            allProducts,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ status: "Internal Server Error" }); 
    }
}
