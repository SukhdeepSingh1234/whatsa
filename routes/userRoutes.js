const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
// const jwt = require('jsonwebtoken')
// const JWT_Token = process.env.JWT_TOKEN;
router.use(express.json());
const User= require('../models/dbVerify')





router.use(express.json());

router.post('/signup',body("name", "name should have a minimum length of 5").isLength({ min: 5 }),
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
                res.status(200).json({ success: false, message:"User Already Exists! Please Log In"});
            }else{
                const {name,email,phone}=req.body;
                const userDetail = await User.create({
                    name: name,
                    email: email,
                    phone: phone,
                    isVerified: false,
                    profileComplete:false,
                  });
                  await userDetail.save()
                  success=true
                  res.status(201).json({ success, userDetail });
            }
        
        }catch (error) {
            success = false;
            if (error.name === "MongoError" && error.code === 11000) {
              // This error occurs when there's a duplicate key (e.g., duplicate phone number)
              res.status(400).json({ success, message: "User with this phone number already exists" });
            } else {
              // Handle other types of errors
              res.status(500).json({ success, message: "Internal server error", error: error.message });
            }
          }
    })



 module.exports = router;


