const mongoose=require("mongoose");

const ConversationSchema=new mongoose.Schema({
       members: {
            type:Array
       },
        message:{
            type:String,
        }
    },{
        timestamps:true
});
// creating collection messageCollection
module.exports= mongoose.model('Conversation',ConversationSchema)