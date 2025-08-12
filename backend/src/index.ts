import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { ClerkExpressRequireAuth } from '@clerk/express';
import { handler as clerkWebhookHandler } from './webhooks/clerk';
import practitionerRoutes from './routes/practitioners';
import companyRoutes from './routes/companies';
import invitationRoutes from './routes/invitations';
import userRoutes from './routes/users';
import searchRoutes from './routes/search';
import oauthRoutes from './routes/oauth';
import appointmentRoutes from './routes/appointments';
import paymentRoutes from './routes/payments';
import './jobs/reminders'; // This will start the cron job

const app = express();
const port = process.env.PORT || 3001;

// Other routes should use express.json()
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Clerk webhook handler
app.post(
  '/api/webhooks/clerk',
  bodyParser.raw({ type: 'application/json' }),
  clerkWebhookHandler
);

app.use('/api/practitioners', practitionerRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api', invitationRoutes); // Using a more generic prefix for these routes
app.use('/api', userRoutes);
app.use('/api', searchRoutes);
app.use('/api', oauthRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', paymentRoutes);

// Clerk error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(401).send('Unauthenticated!');
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
