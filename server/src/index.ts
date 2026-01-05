import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// API Routes Placeholder
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'UnoHub API is running' });
});

// Serve static files from the client build in production
// Adjust path to assume client/dist is adjacent or copied
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
