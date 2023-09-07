//importing
const express = require("express");

const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Messages = require("./models/dbMessages");
const cors = require("cors");
const User = require("./models/dbVerify");
const generateOTP = require("./generateOtp");
const dotenv = require("dotenv");
const authenticateUser = require("./middleware/authenticateUser");

// Routes
const userRoute = require("./routes/userRoutes");
const sendOtpRoute = require("./routes/sendOtp");

dotenv.config();

const app = express();
app.use(cors());

//config
const port = process.env.PORT || 3000;

// const pusher = new Pusher({
//     appId: "1642033",
//     key: "2f97fad1caa7f16732ce",
//     secret: "d3387288a7d27f6f6368",
//     cluster: "ap2",
//     useTLS: true
//   });
// middlewares

app.use(express.json());
app.use(cors());

// app.use((req,res,next)=>{
//     res.setHeader("Access-Control-Allow-Origin","*")
//     res.setHeader("Access-Control-Allow-Headers","*")
//     next()
// })

// dbconfig

mongoose.connect(process.env.DATABASE);

// configuring Pusher to get real time database feature
const db = mongoose.connection;
console.log("DB Connected");

// db.once('open',()=>{

//     // remember to put "s" at the end of the collection as mongoose automatically creates a plural collection else we will be unable to detect
//     const msgCollection=db.collection("messagecontents")// here the collection name should be the same we created before so that the pusher listens to that particular collection for changes in real time
//     const changeStream=msgCollection.watch(); // here pusher watches for the change in collection

//     changeStream.on('change',(change)=>{ // if change happens in the stream then invoke the function
//         console.log(change)
//         if(change.operationType==='insert'){ // operationType is a status json that tells if inserted or not if yes
//             const messageDetails=change.fullDocument;// then get the full document from the json that contains data of message and name,..etc parameter we gave in the body
//             pusher.trigger('messages','inserted', // messages will be the channel that checks for change inserted and trigger the pusher
//             {
//                 name:messageDetails.name,
//                 message:messageDetails.message,
//                 timestamp:messageDetails.timestamp,
//                 received:messageDetails.received
//             })
//         }else{
//             console.log("Error triggering Pusher")
//         }
//     })
// })

// api routes

app.use("/api/auth", userRoute);
app.use("/api/otp", sendOtpRoute);

app.get("*", (req, res) => {
  res.redirect("/");
});

// app.get('/messages/sync',(req,res)=>{
//     Messages.find({})
//         .then((data)=>{
//             res.status(201).send(data)
//         })
//         .catch((err)=>{
//             res.status(500).send(err)
//         })
// })

// app.post('/messages/new',(req,res)=>{
//     const dbMessage=new Messages(req.body);
//     Messages.create(dbMessage)
//         .then((data)=>{
//             res.status(201).send(data)
//         })
//         .catch((err)=>{
//             res.status(500).send(err)
//         })
// })

app.post("/status", authenticateUser, async (req, res) => {
  try {
    // authenticated user ID
    const userId = req.user;
    // Use Mongoose to fetch data from MongoDB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { isOnline, lastSeen } = req.body;
    user.isOnline = isOnline;
    user.lastSeen = lastSeen;
    await user.save();
    res.status(200).json({
      status: user.isOnline,
      lastSeen: user.lastSeen,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Use the authenticateUser middleware for routes that require authentication
app.post("/upload", authenticateUser, async (req, res) => {
  const userId = req.user;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { image, bio } = req.body; // getting the body
  // Update the user's image and bio
  user.image = image;
  user.bio = bio;
  user.profileComplete = true;
  // Save the updated user profile
  await user.save();

  const success = true;
  res.status(201).json({ success });
});

app.post("/getUserData", authenticateUser, async (req, res) => {
  try {
    // authenticated user ID
    const userId = req.user;
    // Use Mongoose to fetch data from MongoDB
    const user = await User.findById(userId);
    //  console.log(user.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(user);
    res.status(200).json({
      username: user.name,
      imageUrl: user.image,
      bio:user.bio
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

//listening

app.listen(port, () => console.log(`listening at port http:${port}`));
