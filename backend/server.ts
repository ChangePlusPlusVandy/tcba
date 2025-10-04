import dotenv from 'dotenv';
import app from './app';

dotenv.config();
const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
