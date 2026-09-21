import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running');
});

// Routes will be added here once built, e.g.:
// import bookRoutes from './src/services/books.route.js';
// app.use('/api/books', bookRoutes);

export default app;