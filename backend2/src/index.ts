import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Backend is running Ishan");
})

app.use("/auth", authRoutes);
// app.use('/api/gst', gstRoutes);
app.use('/courses', courseRoutes);

app.listen(process.env.PORT || 5000, ()=>{
    console.log("app is running on port: ", process.env.PORT || 5000);
})