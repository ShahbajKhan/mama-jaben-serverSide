const express = require('express');
const app = express();
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').config();
const port = process.env.PORT || 5000;
const admin = require("firebase-admin")


app.use(cors());
app.use(express.json());


var serviceAccount = require("./.configs/mama-jaben-firebase-adminsdk-vpoe2-df6bae54dd.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



app.get('/', (req, res) => {
    res.send('Hello World!')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q0qwx.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const vehicleCollection = client.db("mamaJaben").collection("vehicles");
    const reviewCollection = client.db("mamaJaben").collection("reviews");
    const adminCollection = client.db("mamaJaben").collection("admin");
    const bookingCollection = client.db("mamaJaben").collection("bookings");


    app.post('/addVehicle', (req, res) => {
        const newVehicle = req.body;
        vehicleCollection.insertOne(newVehicle)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    });

    app.get('/vehicles', (req, res) => {
        vehicleCollection.find()
            .toArray((err, items) => {
                res.send(items)
            })
    });
    // Post- review by user
    app.post('/addReview', (req, res) => {
        const newReview = req.body;
        reviewCollection.insertOne(newReview)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    });

    app.get('/reviews', (req, res) => {
        reviewCollection.find()
            .toArray((err, items) => {
                res.send(items)
            })
    });

    app.post('/addAdmin', (req, res) => {
        const newAdmin = req.body;
        console.log(newAdmin);
        adminCollection.insertOne(newAdmin)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    });

    app.get('/admins', (req, res) => {
        adminCollection.find()
            .toArray((err, items) => {
                res.send(items)
            })
    });

    app.get('/vehicles/:id', (req,res)=>{
        vehicleCollection.find({_id:ObjectID(req.params.id)})
        .toArray((err, documents)=>{
            res.send(documents[0])
            
        })
    })
    app.post('/bookVehicle', (req, res) => {
        const bookVehicle = req.body;
        bookingCollection.insertOne(bookVehicle)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    });

    app.get('/bookings', (req, res)=>{
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail === queryEmail) {
                        bookingCollection.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else {
                        res.status(401).send("Unauthorized access");
                    }
                })
                .catch((error) => {
                    res.status(401).send("Unauthorized access");
                });
        }
        else {
            res.status(401).send("Unauthorized access");
        }

    });

    app.get('/allBookings', (req, res) => {
        bookingCollection.find()
            .toArray((err, items) => {
                res.send(items)
            })
    });

    app.patch('/update/:id',(req,res)=>{
        bookingCollection.updateOne({_id: ObjectID(req.params.id)},
         {
          $set:{status:req.body.status}
         })
         .then (result=>{
            res.send(result.modifiedCount>0)
         })
      })

    app.delete('/deleteVehicle/:id', (req, res) => {
        const id = ObjectID(req.params.id);
        console.log("DELETING", id);
        vehicleCollection.findOneAndDelete({ _id: id })
        .then((result)=>{
            res.send(result.deletedCount > 0);
        })
    })
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})