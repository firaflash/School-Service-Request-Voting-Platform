import express from 'express';              // Main web framework
import path from "path";
import dotenv from 'dotenv';                 // Load environment variables from .env file
import { fileURLToPath } from 'url';         // Needed for __dirname in ES modules

dotenv.config();                             // Read .env file and make variables available

const app = express();                       // Create Express application

// Middleware
app.use(express.json());                     // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parse form data (urlencoded)
app.use(express.static('../Public'));        // Serve static files from ../Public folder

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 
const frontendPath = path.join(__dirname, '..', 'Public');

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html')); // ← frontendPath is undefined!
});

app.post('/vote', (req, res) => {
  const { serviceId, vote } = req.body;
  res.json({ success: true, message: 'Vote recorded!' });
});

export default app;                          // Export app (good for testing or modular setup)

const PORT = process.env.PORT || 5000;

// Only start server in development mode
// (in production you usually let host like Render/Vercel/railway start it)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {                 
    console.log(`Server Running on port http://localhost:${PORT}`);
  });
}