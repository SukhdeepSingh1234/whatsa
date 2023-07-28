//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js"
import Pusher from "pusher";
import cors from 'cors'

//config
const app=express();
const port=process.env.PORT || 9000

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
const connection_url= 'mongodb+srv://admin:EzY7OT9bfJxyGYYh@cluster0.6mv9wz7.mongodb.net/whatsappDb?retryWrites=true&w=majority'
mongoose.connect(connection_url)

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
    






//listening

app.listen(port,()=>
    console.log(`listening at port http:${port}`)
)