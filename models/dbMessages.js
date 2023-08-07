import mongoose from "mongoose";

const whatsappSchema=new mongoose.Schema({
        message:String,
        name:String,
        timestamp:String,
        received:Boolean,
})
// creating collection messageCollection
export default mongoose.model('messagecontent',whatsappSchema)