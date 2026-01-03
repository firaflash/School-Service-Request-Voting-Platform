import express from 'express';
import dotenv from 'dotenv';

dotenv.config();  // Load env vars if needed

const app = express();
const PORT = 3000;

// Middleware (add this for JSON bodies, e.g., for voting POST requests)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fixed route: Now sends a response
app.get('/', (req, res) => {
  console.log("Landing Page sent from the server");
  res.send('Hello from School Service Request Voting Platform!');  // Or res.json({ message: '...' });
});

// Example voting route (add more as needed)
app.post('/vote', (req, res) => {
  const { serviceId, vote } = req.body;
  // Your voting logic here (e.g., save to DB)
  console.log(`Vote received for service ${serviceId}: ${vote}`);
  res.json({ success: true, message: 'Vote recorded!' });
});

export default app;

// Only listen locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running locally on port http://localhost:${PORT}`);
  });
}