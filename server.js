//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./models/dbMessages.js"
import Pusher from "pusher";
import cors from 'cors'
import User from './models/dbVerify.js'
import { body,validationResult } from "express-validator";
import jwt from 'jsonwebtoken'
import generateOTP from './generateOtp.js'
import dotenv from 'dotenv'
import authenticateUser from './middleware/authenticateUser.js'

dotenv.config()

let storedOTPs = {};


//config
const app=express();
const port=process.env.PORT || 4000

const pusher = new Pusher({
    appId: "1642033",
    key: "2f97fad1caa7f16732ce",
    secret: "d3387288a7d27f6f6368",
    cluster: "ap2",
    useTLS: true
  });
// middlewares

app.use(express.json())
app.use(cors())

// app.use((req,res,next)=>{
//     res.setHeader("Access-Control-Allow-Origin","*")
//     res.setHeader("Access-Control-Allow-Headers","*")
//     next()
// })

// dbconfig

mongoose.connect(process.env.DATABASE)

// configuring Pusher to get real time database feature
const db=mongoose.connection;
db.once('open',()=>{
    console.log("DB Connected")
    // remember to put "s" at the end of the collection as mongoose automatically creates a plural collection else we will be unable to detect
    const msgCollection=db.collection("messagecontents")// here the collection name should be the same we created before so that the pusher listens to that particular collection for changes in real time
    const changeStream=msgCollection.watch(); // here pusher watches for the change in collection

    changeStream.on('change',(change)=>{ // if change happens in the stream then invoke the function
        console.log(change)
        if(change.operationType==='insert'){ // operationType is a status json that tells if inserted or not if yes
            const messageDetails=change.fullDocument;// then get the full document from the json that contains data of message and name,..etc parameter we gave in the body
            pusher.trigger('messages','inserted', // messages will be the channel that checks for change inserted and trigger the pusher
            {
                name:messageDetails.name,
                message:messageDetails.message,
                timestamp:messageDetails.timestamp,
                received:messageDetails.received
            })
        }else{
            console.log("Error triggering Pusher")
        }
    })
})

// api routes


app.get('/',(req,res)=>{
    res.status(200).send("hello world it works")
})

app.get('/messages/sync',(req,res)=>{
    Messages.find({})
        .then((data)=>{
            res.status(201).send(data)
        })
        .catch((err)=>{
            res.status(500).send(err)
        })        
})

app.post('/messages/new',(req,res)=>{
    const dbMessage=new Messages(req.body);
    Messages.create(dbMessage)
        .then((data)=>{
            res.status(201).send(data)
        })
        .catch((err)=>{
            res.status(500).send(err)
        })          
})

app.post('/signup',body("name", "name should have a minimum length of 5").isLength({ min: 5 }),
    body("email","Invalid format of email ").isEmail(),
    body("phone").custom((value)=>{
    // Check if the phone number is exactly 10 digits and doesn't start with "0"
    if (!/^[1-9]\d{9}$/.test(value)) {
        throw new Error(
            'Invalid phone number. It should be exactly 10 digits and should not start with "0"'
          );
    }
    return true; // Return true if validation passes
    }),
    
    async (req,res)=>{
        let success=false;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success, errors: errors.array() });
        }
        

        try{
            const validateUser= await User.findOne({phone: req.body.phone})
            if(validateUser){
                // const id =validateUser.id;
                // if(validateUser.isVerified===true){
                //     const authToken=jwt.sign( id, process.env.JWT_TOKEN ) 
                //     res.status(200).json({ success: true, authToken });
                // }else{
                //     res.status(200).json({ success: false, message:"Please click genereate otp"});
                    
                // }
                res.status(200).json({ success: false, message:"User Already Exists! Please Log In"});
            }else{
                const {name,email,phone}=req.body;
                const userDetail = await User.create({
                    name: name,
                    email: email,
                    phone: phone,
                    isVerified: false,
                  });
                  await userDetail.save()
                  success=true
                  res.status(201).json({ success, userDetail });
            }
        
        }catch (error) {
            success = false;
            res.status(400).json({ success: "Invalid credentials", error });
          }

        // const phone=req.body.phone;
        // res.send(phone)
    })


app.post('/sendotp',async (req,res)=>{
    let success = false;
    try {
        const {email}=req.body;
        const user=await User.findOne({email})
        // Generate and send the OTP only if the user exists
        if (user){
            const otp = generateOTP(email); // Assuming you have a function named 'generateOTP' that generates the OTP from .js file
            storedOTPs[email] = otp;
            res
            .status(200)
            .json({ success: true, message: "OTP sent successfully", otp });
        }else{
            res
            .status(200)
            .json({ success: false, message: "User don't exists"});
        }
    } catch (error) {
        res
        .status(500)
        .json({ success: false, message: "Internal server error occurred" });
    }
})

app.post('/verify',async (req,res)=>{
    try{
        console.log(storedOTPs)
        const {otp}=req.body;
        const email = Object.keys(storedOTPs).find(
            (key) => storedOTPs[key] === otp
          );
          const user= await User.findOne({email})
          // Verify the reset password OTP
          const storedOTP = storedOTPs[email]
          if( !storedOTP || storedOTP===otp){
            await User.updateOne({email:email},{$set:{isVerified:true} })
            const id=user.id;
            const authToken=jwt.sign( id, process.env.JWT_TOKEN ) 
            return res.status(200).json({ success: true, authToken,message: "verified." });
          }
          else{
            return res
              .status(400)
              .json({ success: false, message: "Invalid OTP." });
          }
    }catch(error){
        res
        .status(500)
        .json({ success: false, message: "Internal server error occurred" });
    }
})

// Use the authenticateUser middleware for routes that require authentication
app.post('/upload', authenticateUser , async (req,res)=>{
    const userId = req.user;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    const {image,bio} =req.body;// getting the body 
    // Update the user's image and bio
    user.image = image;
    user.bio = bio;

    // Save the updated user profile
    await user.save();
    const success=true
    res.status(201).json({ success });

})

app.post('/getUserData',authenticateUser , async (req, res) => {
    try {

        // authenticated user ID
        const userId = req.user;
        // Use Mongoose to fetch data from MongoDB
         const user = await User.findById(userId);
    
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
    
        res.status(200).json({
            username: user.name,
            imageUrl: user.image,
        });
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
        }
  });



//listening

app.listen(port,()=>
    console.log(`listening at port http:${port}`)
)