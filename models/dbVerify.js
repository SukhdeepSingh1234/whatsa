import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    name:{ type: String, required: true },
    email: { type: String, required: true, unique:true },
    phone:{ type: String, required: true, unique:true },
    isVerified:{ type: Boolean, required: true },
    image:{type:String,required: true },
    bio:{type:String,required: true }
})

export default mongoose.model('userDetail',userSchema) 