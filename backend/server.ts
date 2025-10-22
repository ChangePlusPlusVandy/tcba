import dotenv from 'dotenv';
import app from './app';
import announcementRoutes from './routes/announcementRoutes';

dotenv.config();
const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello!' });
});

app.use('/api/announcements', announcementRoutes);

export default app;
