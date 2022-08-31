const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken'); 
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');

app.use(cors());
app.use(express.json());

function verifyJwt(req,res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message:'unauthorized access'});
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decode) =>{
    if(err){
      return res.status(403).send({message:'Forbidden access'});
    }
    console.log('decoded', decoded);
    req.decode = decode;
    next();

  })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cyug2hl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){

  try{
    await client.connect();
    const serviceCollection = client.db('project1').collection('services');
    const quoteCollection = client.db('project1').collection('quote')


    app.post('/login', async (req,res) =>{
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: '1d'
      });
      res.send({accessToken})
    })

    app.get('/services', async(req,res)=>{
      const query = {};
      const cursor = serviceCollection.find(query);
      const service = await cursor.toArray()
      res.send(service);
    });

    app.get('/quote', async(req,res)=>{
      const query = {};
      const cursor = quoteCollection.find(query);
      const quote = await cursor.toArray();
      res.send(quote)
    });

    app.get('/services/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id:ObjectId(id)};
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

  app.post('/services',async (req,res)=>{
    const newServices = req.body;
    const result = await serviceCollection.insertOne(newServices);
    res.send(result);
  });

  app.delete('/services/:id',async (req,res) =>{
    const id = req.params.id;
    const quary = {_id: ObjectId(id)};
    const result = await serviceCollection.deleteOne(quary);
    res.send(result)
  });


  app.get('/service', async(req,res) =>{
    const decodedEmail = req.decoded.email;
    const email= req.query.email;
    if(email === decodedEmail){
      const query = {email: email};
      const cursor = serviceCollection.find(query);
      const products = await cursor.toArray();
      res.send(products)
    }else{
    res.status(403).send({message:'Forbiden access'})
    }
  });


  app.put('/updateQuantity/:id', async (req,res) =>{
    const id = req.params.id;
    const quantity = req.body.newQuantity;
    const filter = {_id: ObjectId(id)};
    const options = { upsert : true};
     let updateQuantity;
     if(quantity == 'sold out'){
      updateQuantity = quantity;
     }
     else{
      updateQuantity = parseInt(quantity);
     }
     const updateDoc = {
      $set: {
        quantity: updateQuantity,
      },
     };
     const result = await serviceCollection.updateOne(filter, updateDoc, options);
     res.json(result)
  });

  }
  finally{

  }

}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Running server')
});

app.listen(port, () => {
  console.log('server is running in my pc', port);
})