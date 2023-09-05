const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({
    name:{ type: String, required: true },
    email: { type: String, required: true, unique:true },
    phone:{ type: String, required: true, unique:true },
    isVerified:{ type: Boolean, required: true },
    image:{type:String},
    bio:{type:String},
    profileComplete:{type:Boolean,require:true},
    isOnline: String, // To track online status
    lastSeen: String,    // To store the last seen timestamp
},{
    timestamps:true
});

module.exports= mongoose.model('userDetail',userSchema) 