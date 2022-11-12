import express from 'express'
import cors from 'cors'
import { createUser } from './schemas.js'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'


//Config
dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

const mongoClient = new MongoClient(process.env.MONGO_URI)
let db

try {
    await mongoClient.connect()
    db = mongoClient.db('bate_uol')
} catch (error) {
    console.log(error)
}

const participantsC = db.collection('participants')

app.post('/participants', async (req, res)=>{

    const body = req.body
    

    const validation = createUser.validate(body)
    if(validation.error){
        res.status(400).send(validation.error.details)
        return;
    }

    try {
        const participants = await participantsC.find().toArray()
        
        if(participants.find(e=>e.name === body.name)){
            res.status(409).send({message:'Usuário já existe'})
            return
        }

        body.lastStatus = Date.now()
        console.log(body)

        await participantsC.insertOne(body)
        res.sendStatus(201)

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }

})

app.get('/participants', async (req, res)=>{

    try {
        const participants = await participantsC.find().toArray()
        res.status(201).send(participants)

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})



app.listen(5000, ()=>console.log('Server on 5000:'))