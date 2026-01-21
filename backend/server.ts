import dotenv from 'dotenv';
import app from './app.js';
import { clerkMiddleware } from '@clerk/express';
import { startScheduledEmailService } from './services/scheduledEmailService.js';
// import { initializeEventReminders } from './services/eventReminderService.js';

dotenv.config();
const PORT = 8000;

app.use(clerkMiddleware());

app.post('/placeholder');
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  startScheduledEmailService();

  // Initialize event reminder cron jobs
  // initializeEventReminders();
});

export default app;
