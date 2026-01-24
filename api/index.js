import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { supabase } from './supabase/supabaseClient.js';
import  databaseRouter  from './supabase/databaseRoute.js'

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from "Public" folder at root URL
const publicPath = path.join(__dirname, '..', 'Public');
app.use(express.static(publicPath));

app.get('/', (req, res) => {
  console.log("at the concert ");
    res.sendFile(path.join(publicPath, 'index.html'));
});

if(supabase) console.log("Supabase initalized successfully ");


app.use('/api/dbs', databaseRouter)

app.post('/vote', (req, res) => {
  console.log('Vote received:', req.body);
  res.json({ success: true, message: 'Vote recorded!' });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running → http://localhost:${PORT}`);
  });
}

export default app;
