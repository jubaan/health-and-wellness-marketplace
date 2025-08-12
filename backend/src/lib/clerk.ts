import { Clerk } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is not set in the environment variables.');
}

const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export default clerkClient;
