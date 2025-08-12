# Health and Wellness Platform

This project is a full-stack web application designed to be a comprehensive directory and marketplace for healthcare and wellness services. It connects patients with practitioners, allows practitioners to promote themselves and their companies, and provides tools for scheduling, payments, and communication.

## Features

- **Practitioner & Company Profiles:** Practitioners can create detailed profiles to showcase their expertise. Companies (clinics, hospitals) can create profiles and associate practitioners with them.
- **Advanced Search:** Patients can search for practitioners based on location, specialty, and other criteria.
- **Appointment Scheduling:** Seamless integration with Google Calendar allows patients to view real-time availability and book appointments directly.
- **Online Payments:** Secure pre-appointment payments powered by Stripe.
- **User Authentication:** Secure sign-up and login for patients and practitioners using Clerk, with support for social providers and email.
- **Automated Notifications:** Email and WhatsApp notifications for appointment confirmations and reminders.
- **Product Analytics:** User behavior tracking with PostHog.

## Tech Stack

- **Frontend:** Next.js (React Framework) with TypeScript and Tailwind CSS.
- **Backend:** Node.js with Express and TypeScript.
- **Database:** PostgreSQL.
- **Deployment:** Docker for local development.
- **Third-Party Services:**
  - **Authentication:** Clerk
  - **Payments:** Stripe
  - **Calendar:** Google Calendar API
  - **Email:** SendGrid
  - **WhatsApp:** Twilio
  - **Analytics:** PostHog

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install backend dependencies:**
    ```bash
    cd backend
    npm install
    cd ..
    ```

3.  **Install frontend dependencies:**
    ```bash
    cd frontend
    npm install
    cd ..
    ```

## Configuration

This project requires credentials for several third-party services.

1.  **Create the environment file:**
    In the root directory, copy the example environment file:
    ```bash
    cp .env_example .env
    ```

2.  **Edit the `.env` file:**
    Open the newly created `.env` file and fill in the values for all the services. You will need to create accounts and get API keys for each of them.

    -   `POSTGRES_*`: These are used by Docker Compose to initialize the database. You can leave the defaults for local development.
    -   `DATABASE_URL`: The connection string for the PostgreSQL database. The default should work with the Docker setup.
    -   `CLERK_SECRET_KEY` & `CLERK_WEBHOOK_SECRET`: Get these from your Clerk Dashboard. You will need to set up a webhook in Clerk pointing to `http://localhost:3001/api/webhooks/clerk`.
    -   `NEXT_PUBLIC_POSTHOG_KEY` & `NEXT_PUBLIC_POSTHOG_HOST`: Get these from your PostHog project.
    -   `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Create a project in the [Google Cloud Console](https://console.cloud.google.com/), enable the Google Calendar API, and create OAuth 2.0 credentials.
    -   `GOOGLE_REDIRECT_URI`: Make sure this matches the authorized redirect URI in your Google Cloud Console credentials. For local development, it should be `http://localhost:3001/api/oauth/google/callback`.
    -   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` & `STRIPE_SECRET_KEY`: Get these from your Stripe Dashboard.
    -   `SENDGRID_API_KEY`: Get this from your SendGrid Dashboard. You will also need to have a verified sender email address.
    -   `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM_NUMBER`: Get these from your Twilio Console. You will need a WhatsApp-enabled number.

## Running the Application

1.  **Start the database:**
    Open a terminal in the root directory and run:
    ```bash
    docker-compose up -d
    ```
    This will start the PostgreSQL database in the background. The first time you run this, it may take a few moments to download the image.

2.  **Start the backend server:**
    Open a new terminal in the root directory and run:
    ```bash
    cd backend
    npm run dev
    ```
    The backend server will start on `http://localhost:3001`.

3.  **Start the frontend server:**
    Open a third terminal in the root directory and run:
    ```bash
    cd frontend
    npm run dev
    ```
    The frontend application will be available at `http://localhost:3000`.

You can now open `http://localhost:3000` in your browser to use the application.

## Deployment

This application is designed to be deployed as separate services for the frontend and backend. Our recommended hosting platform for this architecture is **Render**, as it provides excellent support for web services, databases, and cron jobs out of the box.

### Recommended Platform: Render

**Render** is a unified cloud platform that can build and run all your apps and websites with free TLS certificates, a global CDN, DDoS protection, private networks, and auto-deploys from Git.

Here is a high-level guide to deploying this project on Render:

1.  **Deploy the Database:**
    -   Create a new **PostgreSQL** instance on Render.
    -   Render will provide you with a connection URL. Use this for your `DATABASE_URL` environment variable in the backend service.

2.  **Deploy the Backend:**
    -   Create a new **Web Service** on Render and connect it to your Git repository.
    -   Set the **Root Directory** to `backend`.
    -   Set the **Build Command** to `npm install`.
    -   Set the **Start Command** to `npm start`. (You may need to add a `start` script to `backend/package.json`, e.g., `"start": "node dist/index.js"`, and a `build` script, e.g., `"build": "tsc"`).
    -   Add all the required environment variables from your `.env` file to the Render service's environment settings.

3.  **Deploy the Frontend:**
    -   Create another new **Web Service** on Render and connect it to the same repository.
    -   Set the **Root Directory** to `frontend`.
    -   Render will likely detect that it's a Next.js application and configure the build and start commands automatically. If not:
        -   Set the **Build Command** to `npm install && npm run build`.
        -   Set the **Start Command** to `npm start`.
    -   Add the `NEXT_PUBLIC_*` environment variables to the Render service's environment settings.

4.  **Deploy the Cron Job:**
    -   Create a new **Cron Job** on Render.
    -   Set the **Root Directory** to `backend`.
    -   Set the **Command** to `node dist/jobs/reminders.js`. (This requires you to build the TypeScript to JavaScript first).
    -   Set the **Schedule** (e.g., `0 * * * *` to run every hour).
    -   Add the necessary environment variables for the cron job to run.

### Alternative Platform: Vercel

**Vercel** is an excellent platform, especially for the Next.js frontend.

-   **Frontend:** Deploying the `frontend` directory to Vercel is seamless and will provide the best performance.
-   **Backend:** You could deploy the backend separately on a platform like Render or adapt it to run on Vercel's Serverless Functions. The cron job would need to be migrated to Vercel Cron Jobs. This approach might require some refactoring of the backend code.
