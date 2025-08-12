CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY, -- This will be the Clerk User ID
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE practitioners (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id),
  specialty VARCHAR(255),
  location VARCHAR(255),
  bio TEXT,
  hourly_rate NUMERIC(10, 2),
  insurance_accepted TEXT[]
);

CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id VARCHAR(255) NOT NULL REFERENCES users(id),
  website VARCHAR(255),
  address VARCHAR(255),
  description TEXT
);

CREATE TABLE company_practitioners (
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  practitioner_user_id VARCHAR(255) REFERENCES practitioners(user_id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, practitioner_user_id)
);

CREATE TABLE invitations (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  -- We invite users, who might not have a practitioner profile yet.
  -- The user must create a practitioner profile before they can accept.
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, declined
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, user_id) -- A user can only be invited to a company once
);

CREATE TABLE user_tokens (
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  PRIMARY KEY (user_id, provider)
);

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  practitioner_user_id VARCHAR(255) NOT NULL REFERENCES practitioners(user_id),
  patient_user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  google_calendar_event_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed', -- confirmed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
