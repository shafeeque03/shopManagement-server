import express from 'express';
import cors from 'cors';
const app = express();
import dotenv from 'dotenv';
import http from 'http';
import dbconnect from './config/Database.js';
import userRoute from './routes/userRoute.js';
import adminRoute from './routes/adminRoute.js';

const port = 5200
dotenv.config();
dbconnect();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    origin:"http://localhost:5173",
    methods:['GET','POST','PUT','PATCH'],
    credentials:true
}));
app.use('/',userRoute);
app.use('/admin',adminRoute);

const server = http.createServer(app);
server.listen(port,()=>console.log(`App working on port ${port}`))
