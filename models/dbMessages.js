const mongoose=require("mongoose");

const whatsappSchema=new mongoose.Schema({
        // message:String,
        // name:String,
        // timestamp:String,
        // received:Boolean,
        sender_id:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'userDetail'
        },
        receiver_id:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'userDetail'
        },
        message:{
                type:String,
                require:true
        }
},{
        timestamps:true
});
// creating collection messageCollection
module.exports= mongoose.model('userChats',whatsappSchema)