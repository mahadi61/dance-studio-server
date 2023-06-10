const express = require('express');
const app = express();
const cors = require('cors');
// const jwt = require('jsonwebtoken');
require('dotenv').config()
// const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2ev6cf0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const usersCollection = client.db("danceDB").collection("users");
    const classCollection = client.db("danceDB").collection("class");
    const enrolledClassCollection = client.db("danceDB").collection("enrolledClass");


    

     // users collection api 
    //  TODO: verifyJWT, verifyAdmin, before async function
     app.get('/allUsers',  async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });


    // get all class for admin dashboard to change the status
    app.get('/admin/allClasses', async (req, res)=>{
      
      const result = await classCollection.find().toArray();
      res.send(result);
    })


    // get all class approved by admin
    app.get('/classes', async (req, res)=>{
      const query = { status : "approved" };
      const result = await classCollection.find(query).toArray();
      res.send(result);
    })


    // get all instructor api
    app.get('/allInstructor', async(req, res)=>{
      const query = { role: "instructor" }
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    })

    // get single class by id 
    app.get("/updateClassData/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await classCollection.findOne(query);
      res.send(result);
    })

    

    // get only instructor classes bye email
    app.get('/instructor/:email', async(req, res)=>{
      const email = req.params.email;
      const query = { instructorEmail: email }
      const result = await classCollection.find(query).toArray();
      res.send(result);
    })


     // update a single class details
     app.put('/class/update-class-data/', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })




    // add class in database api
    app.post('/addClass', async (req, res) => {
      const classData = req.body;
      const result = await classCollection.insertOne(classData);
      res.send(result);
    });



    // store user email on database
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const exist = await usersCollection.findOne(query);

      if (exist) {
        return res.send({ message: 'user already exists' })
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // make user admin api
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
   


     // check admin with email
    //  TODO: verify jwt
     app.get('/allUsers/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })

    


     // check instructor with email
   
     app.get('/allUsers/instructor/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === 'instructor' }
      res.send(result);
    })


    // make user admin api

    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })


    // approved class api approved by admin
    app.patch('/approved-classes/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'approved'
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    // denied class api approved by admin
    app.patch('/denied-classes/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'denied'
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);

    })


    // create enroll api for one user
    app.get('/my-selected-class/:email', async(req, res)=>{
      const email = req.params.email;
      const query = { enrolledBy: email, paymentStatus: "pending" };
      const result = await enrolledClassCollection.find(query).toArray();
      res.send(result);
    })


    // delete enroll class api for one user
    app.patch('/delete-class', async(req, res)=>{
      const id = req.body.id;
      const query = { _id: new ObjectId(id) };
      const result = await enrolledClassCollection.deleteOne(query);
      res.send(result);
    })



    // enroll api
    app.post('/enroll-class', async (req, res) => {
      const id = req.body.classId;
      const enrolledBy = req.body.enrolledBy;
      const filter = { _id: new ObjectId(id) };
      let enrolledClass = await classCollection.findOne(filter);
      enrolledClass = {...enrolledClass, paymentStatus: "pending", enrolledBy}
      delete enrolledClass._id;
      const enrolledClassList = await enrolledClassCollection.insertOne(enrolledClass)
      res.send(enrolledClassList);

    })











    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Dance Studio server is running')
  })
  
app.listen(port, () => {
    console.log(`Dance Studio server is running on port ${port}`);
  })