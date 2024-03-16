//importing
const express = require("express");
const grid = require("gridfs-stream");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Messages = require("./models/dbMessages");
const cors = require("cors");
const User = require("./models/dbVerify");
const generateOTP = require("./generateOtp");
const dotenv = require("dotenv");
const authenticateUser = require("./middleware/authenticateUser");
const Conversation = require("./models/Conversation");
const Message = require("./models/dbMessages");
// Routes
const userRoute = require("./routes/userRoutes");
const sendOtpRoute = require("./routes/sendOtp");
const upload = require("./middleware/upload");
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

// app.use((req,res,next)=>{
//     res.setHeader("Access-Control-Allow-Origin","*")
//     res.setHeader("Access-Control-Allow-Headers","*")
//     next()
// })

// dbconfig

mongoose.connect(process.env.DATABASE);

// configuring Pusher to get real time database feature

console.log("DB Connected");

const conn = mongoose.connection;
let gfs, gridFsBucket;
conn.once("open", () => {
  gridFsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "fs",
  });
  gfs = grid(conn.db, mongoose.mongo);
  gfs.collection("fs");
});

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

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
    console.log(user);
    //  console.log(user.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(user);
    res.status(200).json({
      id: user.id,
      username: user.name,
      imageUrl: user.image,
      bio: user.bio,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/convesation/add", async (req, res) => {
  try {
    const senderId = req.body.senderId;
    const receiverId = req.body.receiverId;
    const exist = await Conversation.findOne({
      members: { $all: [receiverId, senderId] },
    }); // $all checks if both the senderId and receiverId are the same inside members
    if (exist) {
      return res.status(200).json("conversation already exists");
    }
    const newConversation = new Conversation({
      members: [senderId, receiverId],
    });
    await newConversation.save();
    res.status(200).json("conversation saved successfully");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/conversation/sync", async (req, res) => {
  try {
    const senderId = req.body.senderId;
    const receiverId = req.body.receiverId;
    let conversation = await Conversation.findOne({
      members: { $all: [receiverId, senderId] },
    });
    return res.status(200).json(conversation);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/messages/new", async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    await Conversation.findByIdAndUpdate(req.body.conversationId, {
      message: req.body.message,
    });
    return res.status(200).json("message saved successfully");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/messages/sync/:id", async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.id });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

const url = process.env.APP_URL || "http://localhost:9000";

app.post("/file/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(404).json("file not found");
  }
  const imageUrl = `${url}/file/${req.file.filename}`;
  return res.status(200).json(imageUrl);
});


app.get("/file/:filename", async (req, res) => {
  try {
    const file = await gfs.files.findOne({ filename: req.params.filename });
    const readStream = gridFsBucket.openDownloadStream(file._id);
    readStream.pipe(res);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//listening

app.listen(port, () => console.log(`listening at port http:${port}`));
