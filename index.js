const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;
var jwt = require('jsonwebtoken');

app.use(cors())
app.use(express.json())
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRATE);

app.post("/create-payment-intent", async (req, res) => {
    const booking = req.body;
    const price = booking.price;
    const amount = price * 100
    const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        "payment_method_types": [
            "card"
        ],
    })
    res.send({
        clientSecret: paymentIntent.client_secret,
    });
})

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    console.log(authHeader)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

app.get('/', (req, res) => {
    res.send('Hello World!')
})

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.x5paqdg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    const productCollection = client.db('filterHouse').collection('products')
    const cartItemCollection = client.db('filterHouse').collection('cartItems')
    const paymentItemCollection = client.db('filterHouse').collection('paymentItems')
    const userCollection = client.db('filterHouse').collection('users')
    const reviewCollection = client.db('filterHouse').collection('reviews')
    try {
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ token })
        })
        app.post('/products', async (req, res) => {
            const products = req.body
            const result = await productCollection.insertOne(products)
            res.send(result)
        })
        app.get('/products', async (req, res) => {
            const query = {};
            const result = await productCollection.find(query).toArray()
            res.send(result)
        })
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await productCollection.deleteOne(query)
            res.send(result)
        })
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id
            const query = { category: id };
            const result = await productCollection.find(query).toArray()
            res.send(result)
        })
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const status = req.body.advertise
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    advertise: status
                },
            };
            const result = await productCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })
        app.post('/cartProducts', async (req, res) => {
            const product = req.body
            const result = await cartItemCollection.insertOne(product)
            res.send(result)
        })
        app.get('/cartProducts', verifyJWT, async (req, res) => {
            const query = {}
            const result = await cartItemCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/cartProducts/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await cartItemCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/cartProduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await cartItemCollection.findOne(query)
            res.send(result)
        })
        app.delete('/cartProduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await cartItemCollection.deleteOne(query)
            res.send(result)
        })
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const id = payment.bookingId;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    paid: true,
                    transectionId: payment.transectionId
                },
            }
            const updatedResult = await cartItemCollection.updateOne(filter, updateDoc, options)
            const result = await paymentItemCollection.insertOne(payment)
            res.send(result)
        })
        app.post('/users', async (req, res) => {
            const users = req.body;
            const result = await userCollection.insertOne(users)
            res.send(result)
        })
        app.get('/users', verifyJWT, async (req, res) => {
            const query = {};
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })
        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })
        app.put('/user/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body.role
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: data
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })
        app.get('/users/:email', verifyJWT, async (req, res) => {
            const email = req.params.email
            const query = { email: email };
            const result = await userCollection.findOne(query)
            res.send(result)
        })
        app.post('/reviews', async (req, res) => {
            const reviews = req.body;
            const result = await reviewCollection.insertOne(reviews)
            res.send(result)
        })
        app.get('/reviews', async (req, res) => {
            const query = {};
            const result = await reviewCollection.find(query).toArray()
            res.send(result)
        })
        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query)
            res.send(result)
        })
        app.patch('/reviews/:id', async (req, res) => {
            const id = req.params.id
            const data = req.body.data
            console.log(data)
            const query = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    review: data
                }
            }
            const result = await reviewCollection.updateOne(query, updatedDoc)
            res.send(result)

        })
        app.get('/reviews/:email', verifyJWT, async (req, res) => {
            const data = req.params.email
            const query = { email: data };
            const result = await reviewCollection.find(query).toArray()
            res.send(result)
        })
    }
    finally {

    }
}
run().catch(err => console.log(err))

app.listen(port, () => {
    console.log(`filter house server is running on port ${port}`)
})