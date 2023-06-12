const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_Secret_key)
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



// verify jwt
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'Unauthorized Access' });
  }
  
  const token = authorization.split(' ')[1];
  
  jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'Unauthorized Access' })
    }
    req.decoded = decoded;
    next();
  })
}







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


   










    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




const usersCollection = client.db("danceDB").collection("users");
const classCollection = client.db("danceDB").collection("class");
const enrolledClassCollection = client.db("danceDB").collection("enrolledClass");
const paidClassCollection = client.db("danceDB").collection("paidClass");

// send jwt token to client
app.post('/jwt', (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.JWT_TOKEN, { expiresIn: '1h' })

  res.send({ token })
})



 // users collection api 
 app.get('/allUsers', async (req, res) => {

  const result = await usersCollection.find().toArray();
  res.send(result);
});


// get all class for admin dashboard to change the status
app.get('/admin/allClasses/:email', verifyJWT, async (req, res)=>{

  const email = req.params.email;
  // check user
  const decodedEmail = req.decoded.email;
  if (email !== decodedEmail) {
    return res.status(403).send({ error: true, message: 'forbidden access' })
  }

  
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


//  Popular Instructors  api
 app.get('/popular-instructors', async(req, res)=>{
  const query = { role: "instructor" }
  const result = await usersCollection.find(query).limit(6).toArray();
  res.send(result);
})




// get single class by id 
app.get("/updateClassData/:id", async(req, res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await classCollection.findOne(query);
  res.send(result);
})


// get popular class
app.get("/popular-class", async(req, res)=>{




  const result = await classCollection.find().limit(6).toArray();
  res.send(result);
})


// get only instructor classes bye email
app.get('/instructor/:email', verifyJWT, async(req, res)=>{
  const email = req.params.email;


  // check user
  const decodedEmail = req.decoded.email;
  if (email !== decodedEmail) {
    return res.status(403).send({ error: true, message: 'forbidden access' })
  }




  const query = { instructorEmail: email }
  const result = await classCollection.find(query).toArray();
  res.send(result);
})


 // update a single class details 
 app.patch('/class/update-class-data/:id', async (req, res) => {
  const id = req.params.id;
  const className = req.body.className;
  const classPhoto = req.body.classPhoto;
  const seats = req.body.seats;
  const price = req.body.price;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      className :  className,
      classPhoto : classPhoto,
      seats : seats,
      price : price
    },
  };

  const result = await classCollection.updateOne(filter, updateDoc);
  res.send(result);
  

})

// feedback api
app.patch('/feedback', async(req, res)=>{
  const feedback = req.body.message;
  const id = req.body.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      feedback: feedback
    },
  };
  const result = await classCollection.updateOne(filter, updateDoc);
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


// create  api for student after payment to get enroll class data by email
app.get('/my-enroll-class/:email', async(req, res)=>{
  const email = req.params.email;
  const query = { email: email};
  const result = await paidClassCollection.find(query).sort({ date: -1 }).toArray();
  res.send(result);
})

// create  api for total enroll student
app.get('/total-enroll-class', async(req, res)=>{
  const result = await paidClassCollection.find().toArray();
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
  enrolledClass = {...enrolledClass, paymentStatus: "pending", enrolledBy, enrolledClassId: id }
  delete enrolledClass._id;
  const enrolledClassList = await enrolledClassCollection.insertOne(enrolledClass)
  res.send(enrolledClassList);

})

  // create payment intent
  app.post('/payment-intent-for-class', async (req, res) => {
    const { price } = req.body;
    const amount = parseInt(price * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card']
    });

    res.send({
      clientSecret: paymentIntent.client_secret
    })
  })


//   // payment  api for storing payment info in database
app.post('/class-payment', async (req, res) => {
  const payment = req.body;
  const id = req.body.classId;
  const enrollClassId = req.body.enrollClassId;
  // update available seats
  const query = { _id: new ObjectId(id) };
  const updateDoc = {
    $inc: { seats: -1 },
  };
  await classCollection.findOneAndUpdate(query, updateDoc);
  //  put class into paid class collection
  const paidClass = await classCollection.findOne(query);
  delete paidClass._id;     
  const newPayment = {...payment, ...paidClass}
  const insertPayment = await paidClassCollection.insertOne(newPayment);
  // delete class from selected class collection
  const deleteClass = await enrolledClassCollection.deleteOne({ _id: new ObjectId(enrollClassId) });

  res.send({ insertPayment, deleteClass});
})










app.get('/', (req, res) => {
    res.send('Dance Studio server is running')
  })
  
app.listen(port, () => {
    console.log(`Dance Studio server is running on port ${port}`);
  })