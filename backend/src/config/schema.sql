-- Uma Clinic Hospital Portal Database Schema

DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;

-- Doctors table
CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  specialization VARCHAR(100) DEFAULT 'ENT Specialist',
  hospital_name VARCHAR(100) DEFAULT 'Uma Clinic',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  patient_uid VARCHAR(50) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  gender VARCHAR(20),
  dob DATE,
  age INTEGER,
  email VARCHAR(150),
  country VARCHAR(100) DEFAULT 'India',
  urgency_level VARCHAR(20) DEFAULT 'Routine',
  clinical_notes TEXT,
  preferred_appointment DATE,
  treatment_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'In Treatment',
  amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Pending',
  payment_date TIMESTAMP DEFAULT NOW()
);

-- Seed Doctor Reddy ONLY (No dummy patients)
INSERT INTO doctors (name, email, password_hash, specialization, hospital_name)
VALUES (
  'Dr. Reddy',
  'reddy@gmail.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lihO',
  'ENT Specialist',
  'Uma Clinic'
);
