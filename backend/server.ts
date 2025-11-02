import dotenv from 'dotenv';
import app from './app';
import { clerkMiddleware } from '@clerk/express';

dotenv.config();
const PORT = 8000;

//clerk middleware
//TODO: check the location (docs says in index.ts but it feels incorrect)
app.use(clerkMiddleware());

app.post('/placeholder');
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
