import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// Your routes
app.get('/', (req, res) => {
  console.log("Landing Page sent from the server");
  res.send('Hello from School Service Request Voting Platform!');
});

app.post('/vote', (req, res) => {
  const { serviceId, vote } = req.body;
  console.log(`Vote received for service ${serviceId}: ${vote}`);
  res.json({ success: true, message: 'Vote recorded!' });
});

// Bridge for Vercel serverless (this is the key!)
export default (req, res) => {
  app(req, res);
};

app.listen(PORT,(req,res)=>{
    console.log(`Server Running on port https://localhost:${PORT}`);
})