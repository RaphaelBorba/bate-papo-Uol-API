import express from 'express'
import cors from 'cors'
import { createMessage, createUser } from './schemas.js'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'


//CONFIGS
dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())


//MONGODB
const mongoClient = new MongoClient(process.env.MONGO_URI)
let db

try {
    await mongoClient.connect()
    db = mongoClient.db('bate_uol')
} catch (error) {
    console.log(error)
}


//COLLECTIONS
const participantsC = db.collection('participants')
const messagesC = db.collection('messages')

//GLOBAL ELEMENTS

let user

//ROUTES
app.post('/participants', async (req, res) => {

    const body = req.body


    const validation = createUser.validate(body)
    if (validation.error) {
        res.status(422).send(validation.error.details.map(e => e.message))
        return;
    }

    try {
        const participants = await participantsC.find().toArray()

        if (participants.find(e => e.name === body.name)) {
            res.status(409).send({ message: 'Usuário já existe' })
            return
        }

        body.lastStatus = Date.now()
        console.log(body)

        user = body.name

        await participantsC.insertOne(body)
        res.sendStatus(201)

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }

})

app.get('/participants', async (req, res) => {

    try {
        const participants = await participantsC.find().toArray()
        res.status(201).send(participants)

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.post('/messages', async (req, res) => {

    const body = req.body;

    const validation = createMessage.validate(body, { abortEarly: false })
    if (validation.error) {
        res.status(422).send(validation.error.details.map(e => e.message))
        return;
    }

    try {
        const participants = await participantsC.find().toArray()

        console.log(body.to)
        console.log(participants)

        if (body.to !== 'Todos' && !participants.find(e => e.name === body.to)) {
            res.status(409).send({ message: 'Este usuário não existe' })
            return
        }

        let d = new Date();
        let time = d.toLocaleTimeString();
        body.time = time

        if(!user){
            res.status(409).send({message:'Usuário não encontrado'})
            return;
        }
        body.from = user
        

        /* await messagesC.insertOne(body) */
        console.log(body)

        res.sendStatus(201)

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }

})



app.listen(5000, () => console.log('Server on 5000:'))