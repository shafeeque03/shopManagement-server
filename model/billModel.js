import mongoose from "mongoose";

const BillSchema = new mongoose.Schema({
    billNumber: {
        type: String,
        required: true,
        unique: true,
    },
    products: [{
        name: {
            type: String,
            required:true
        },
        price:{
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        },
        productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
        },
        code:{
            type: String,
        }
    }],
    createdBy: {
        name:{
            type:String,
            required: true
        },
        isAdmin:{
            type: Boolean
        },
        id:{
            type: String
        }
    },
    taxAmount:{
        type:Number,
    },
    taxRate:{
        type:Number,
    },
    discount:{
        type: Number,
    },
    subTotal:{
        type: Number,
        required: true
    },
    total:{
        type: Number,
        required: true,
    },
    paymentMethod: {  
        type: String,
        enum: ['cash', 'bank transfer',],
        required: true
    },

}, { timestamps: true });

export default mongoose.model('bill', BillSchema);
