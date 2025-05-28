import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; // You forgot to import this
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables early
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

app.use(
  cors({
    origin: BASE_URL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'SocioFeed Backend is running!' });
});

app.use('/auth', authRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
