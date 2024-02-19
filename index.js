const express = require('express')
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000 ;
const cors = require('cors');


app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}))
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gzl03ny.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const verifyToken = async (req, res, next)=>{
  // const token = req.cookies?.token;
  const token = req.cookies?.token;
  console.log('leee', token)
  if (!token) {
    return res.status(401).send({message: 'Unauthorized'})
  }
  jwt.verify (token, process.env.Token_Pass, (err, decoded)=>{
    if (err) {
      return res.status(401).send({message: '1Unauthorized'})
    }
    req.user = decoded;
    next();
  })
  // next()
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const Sercollection = client.db("CarDoctor").collection("serves");
    const Bookingrcollection = client.db("CarDoctor").collection("Booking");
    const usercollection = client.db("CarDoctor").collection("user");

    // All Servis 
    app.get('/serves', async(req, res)=>{
      const cursor = Sercollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // get one Servise
    app.get('/serves/:id', async(req, res)=>{
      const id = req.params.id;
      // console.log(id)
      const query = {_id: new ObjectId(id)};

      const options = {
        // Sort matched documents in descending order by rating
        // sort: { "imdb.rating": -1 },
        // Include only the `title` and `imdb` fields in the returned document
        projection: {  title: 1, price: 1, service_id: 1, img: 1, _id:1 }
      };
      const result = await Sercollection.findOne(query , options);
      res.send(result)
    })
    // Booking Post

    app.post("/BookingOrder", async(req, res)=>{
      const Booking = req.body;
      
      // console.log(Booking);
      const result = await Bookingrcollection.insertOne(Booking);
      res.send(result)
    })
    // Booking List Get..............
    app.get("/BookingOrder",verifyToken, async(req, res)=>{
      
      // console.log(req.query.email)
      console.log('likioooooooooooooo', req.cookies.token)
      if (req.query.email !== req.user.email) {
        return  res.status(403).send({message: 'Forbiden'})
      }
      let query = {};
      if (req.query?.email) {
        query = {email: req.query?.email}
        
      }
      const result = await Bookingrcollection.find(query).toArray();
      res.send(result)
    })
    // Booking Delete oftion 
    app.delete("/BookingOrder/:id", async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await Bookingrcollection.deleteOne(query);
      res.send(result)
    })
    // Ubdated a singal part ..........
    app.patch("/BookingOrder/:id", async (req, res) =>{
      const ubDatedBook = req.body;
      const id = req.params.id;
      const filters = {_id: new ObjectId(id)}
      const updateDoc = {
        $set: {
          status: ubDatedBook.status
        },
      };
      const result = await Bookingrcollection.updateOne(filters, updateDoc);
      res.send(result)
      console.log(ubDatedBook)
    })
    // Sing Up User data
    app.post("/user", async(req, res)=>{
      const user = req.body;
      console.log(user)
      const result = await usercollection.insertOne(user);
      res.send(result);
    })
    // User login time chang 
    app.get('/user', async (req, res) =>{
      const cursor = usercollection.find();
      const result = await cursor.toArray();
      res.send(result);
  })
    // LogIn time set
    app.patch('/user', async (req, res)=>{
      const user = req.body;
      // console.log(user)
      const userEmail = { email:user.email};
      const ubdateDoc ={
        $set:{
          listTimeLogin:user.listTime
        }
      }
      const result = await usercollection.updateOne(userEmail, ubdateDoc);
      res.send(result);
      
    })
    // JWT Token
    app.post("/jwt", async(req, res)=>{
      const user = req.body;
      console.log(user);
      // token genaret s
      const token = jwt.sign(user, process.env.Token_Pass, {expiresIn: "1h"})
      res
      .cookie('token', token,{
        httpOnly:true,
        secure: false,
        // sameSite:'none',

      })
      .send({Success: true})
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } 
  finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})