const multer  = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const dotenv = require("dotenv");

dotenv.config();


const storage = new GridFsStorage({
     url :process.env.DATABASE,
     file:(req,file)=>{
        const match =["image/png", "image/jpeg", "image/jpg"]
        if(match.indexOf(file.mimeType)===-1){
            return `${Date.now()}-file-${file.originalname}`
        }
        return {
            bucketName:'photos',
            filename:`${Date.now()}-file-${file.originalname}`
        }
     }
    });

module.exports =multer({storage})