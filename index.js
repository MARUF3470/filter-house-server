const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())
require('dotenv').config()

app.get('/', (req, res) => {
    res.send('Hello World!')
})

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.x5paqdg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    const productCollection = client.db('filterHouse').collection('products')
    const cartItemCollection = client.db('filterHouse').collection('cartItems')
    try {
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
            console.log(id)
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
        app.post('/cartProducts', async (req, res) => {
            const product = req.body
            const result = await cartItemCollection.insertOne(product)
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