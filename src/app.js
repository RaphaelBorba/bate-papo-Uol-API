import express from 'express'
import cors from 'cors'
import { createMessage, createUser } from './schemas.js'
import dotenv from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'


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
    const user = req.headers.user;

    const validation = createMessage.validate(body, { abortEarly: false })
    if (validation.error) {
        res.status(422).send(validation.error.details.map(e => e.message))
        return;
    }

    try {
        const participants = await participantsC.find().toArray()

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
        

        await messagesC.insertOne(body)

        res.sendStatus(201)

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }

})

app.get('/messages', async (req, res)=>{

    const limit = req.query.limit
    const user = req.headers.user

    try {
        const messages = await messagesC.find().toArray()

        let showMessages = messages.filter(e => e.to === user || e.from===user || e.to==='Todos' )

        if(limit){
            showMessages = showMessages.slice(0,limit)
        }

        res.status(200).send(showMessages)

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.post('/status', async(req,res)=>{

    const user = req.headers.user

    if(!user){
        res.sendStatus(404)
        return
    }

    try {
        const participants = await participantsC.find().toArray()
        participantsC.updateOne({name:user}, {$set : {lastStatus: Date.now()}})

        res.sendStatus(200)

    } catch (error) {
        res.sendStatus(500)
    }
})

app.delete('/messages/:id', async (req, res)=>{

    const messageId = req.params.id
    const user = req.headers.user

    try {
        const message = await messagesC.findOne({_id: ObjectId(messageId)})

        if(!message){
            res.sendStatus(404)
            return
        }
        if(message.from !== user){
            res.sendStatus(401)
            return
        }

        await messagesC.deleteOne({_id: ObjectId(messageId)})

        res.status(200).send({message: 'Mensagem apagada!'})
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }

})

setInterval(async ()=>{
    const participants = await participantsC.find().toArray()

    participants.forEach(async (e)=>{
        let d = new Date();
        let time = d.toLocaleTimeString();
        if(( (Date.now()/1000)) - (e.lastStatus/1000) > 10){
            await participantsC.deleteOne({name: e.name})
            await messagesC.insertOne({
                from: e.name,
                to:'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: time
            })
        }
    })
}, 15000)


app.listen(5000, () => console.log('Server on 5000:'))