import express from 'express';
import cors from 'cors';
import bookRoutes from "./src/routes/book.route.js";
import memberRoutes from "./src/routes/member.route.js";
import issueRoutes from "./src/routes/issue.route.js";
import overdueRoutes from "./src/routes/overdue.route.js";
import dashboardRoutes from "./src/routes/dashboard.route.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running');
});

app.use('/api', bookRoutes);
app.use('/api', memberRoutes);
app.use('/api', issueRoutes);
app.use('/api', overdueRoutes);
app.use('/api', dashboardRoutes);

export default app;