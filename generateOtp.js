const express = require('express');

const randomstring= require( 'randomstring')
const nodemailer= require( 'nodemailer')
const router = express.Router();
router.use(express.json());
const dotenv= require( 'dotenv')
dotenv.config()

const sendOTP = (email) => {
    const otp = randomstring.generate({ length: 6, charset: 'numeric' });
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });
    console.log(transporter)
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "OTP Verification",
        text: `Thanks for verifing. Your OTP is: ${otp}`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            res.status(500).json({ success: false, response: "Failed to send OTP." });
        } else {
            console.log("Email sent: " + info.response);
            // storedOTPs[email] = otp; // Store the OTP in memory
            return res.status(200).json({ success: true, response: info.response });
        }
    });
    return otp;

}

module.exports= sendOTP;