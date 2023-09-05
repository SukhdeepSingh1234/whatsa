const express = require('express');
const router = express.Router();
router.use(express.json());
const User= require('../models/dbVerify');
const generateOTP=require('../generateOtp')
const jwt = require('jsonwebtoken')
let storedOTPs = {};
router.post('/sendotp',async (req,res)=>{
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
        res.status(500).json({ success, message: "Internal server error", error: error.message })
    }
})
router.post('/verify',async (req,res)=>{
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
            const profile=user.profileComplete;
            const authToken=jwt.sign( id, process.env.JWT_TOKEN ) 
            return res.status(200).json({ success: true, authToken,message: "verified.",profile:profile });
          }
          else{
            return res
              .status(400)
              .json({ success: false, message: "Invalid OTP." });
          }
    }catch(error){
        res.status(500).json({ success: false, message: "Internal server error", error: error.message })
    }
})

module.exports=router;
