import dotenv from 'dotenv';
import app from './app';
import { clerkMiddleware } from '@clerk/express';
import { startScheduledEmailService } from './services/scheduledEmailService.js';

dotenv.config();
const PORT = 8000;

app.use(clerkMiddleware());

app.post('/placeholder');
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  startScheduledEmailService();
});

export default app;
