import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('../Public'))



const PORT = process.env.PORT || 5000;


app.get('/', (req, res) => {
  res.send('Hello from School Service Request Voting Platform!');
});

app.post('/vote', (req, res) => {
  const { serviceId, vote } = req.body;
  res.json({ success: true, message: 'Vote recorded!' });
});

export default app;


if(process.env.NODE_ENV !== 'production'){
  app.listen(PORT,(req,res)=>{
    console.log(`Server Running on port  http://localhost:${PORT}`);
  })
}
