import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import helmet from 'helmet'; // For securing HTTP headers
import rateLimit from 'express-rate-limit'; // For rate limiting
import mongoSanitize from 'express-mongo-sanitize'; // For preventing NoSQL injections
import xssClean from 'xss-clean'; // For preventing cross-site scripting
import hpp from 'hpp'; // For preventing HTTP parameter pollution
import dbconnect from './config/Database.js';
import userRoute from './routes/userRoute.js';
import adminRoute from './routes/adminRoute.js';

dotenv.config();
dbconnect();

const app = express();
const port = 5200;

// Security Features
// 1. Set Security Headers
app.use(helmet());

// 2. Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use(apiLimiter);

// 3. Prevent NoSQL Injection
app.use(mongoSanitize());

// 4. Prevent XSS Attacks
app.use(xssClean());

// 5. Prevent HTTP Parameter Pollution
app.use(hpp());

// 6. Enable CORS
app.use(cors({
    origin: "http://localhost:5173",
    methods: ['GET', 'POST', 'PUT', 'PATCH'],
    credentials: true,
}));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/', userRoute);
app.use('/admin', adminRoute);

// Server Creation
const server = http.createServer(app);
server.listen(port, () => console.log(`App working on port ${port}`));
