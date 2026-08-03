const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'hospital_portal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  connectionTimeoutMillis: 300,
});

let isDbConnected = false;
let pgCheckTimer = 0;

// Store with NO dummy patients
const mockStore = {
  doctors: [
    {
      id: 1,
      name: 'Dr. Reddy',
      email: 'reddy@gmail.com',
      password_hash: bcrypt.hashSync('32432432s', 10),
      specialization: 'ENT Specialist',
      hospital_name: 'Uma Clinic',
    }
  ],
  patients: [],
  payments: []
};

// Safe query wrapper
const safeQuery = async (text, params) => {
  const now = Date.now();
  if (!isDbConnected && now < pgCheckTimer) {
    return executeMockQuery(text, params);
  }

  try {
    const result = await pool.query(text, params);
    isDbConnected = true;
    return result;
  } catch (err) {
    isDbConnected = false;
    pgCheckTimer = now + 10000; // Skip retry for 10 seconds to avoid delay
    return executeMockQuery(text, params);
  }
};

const executeMockQuery = (text, params) => {
  const queryStr = text.toLowerCase();

  // Find doctor by email
  if (queryStr.includes('select * from doctors where email')) {
    const email = params[0];
    const doc = mockStore.doctors.find(d => d.email.toLowerCase() === email.toLowerCase());
    return { rows: doc ? [doc] : [] };
  }

  // Get doctor by ID
  if (queryStr.includes('select id, name, email, specialization, hospital_name from doctors where id')) {
    const id = params[0];
    const doc = mockStore.doctors.find(d => d.id === id);
    return { rows: doc ? [doc] : [] };
  }

  // Get patient by direct ID
  if (queryStr.includes('from patients where id = $1') || queryStr.includes('from patients where id=')) {
    const id = Number(params[0]);
    const doctorId = params[1] ? Number(params[1]) : 1;
    const pt = mockStore.patients.find(p => Number(p.id) === id && (!doctorId || Number(p.doctor_id) === doctorId));
    return { rows: pt ? [pt] : [] };
  }

  // Get patient by payment join
  if (queryStr.includes('from payments pay join patients p')) {
    const payId = Number(params[0]);
    const doctorId = params[1] ? Number(params[1]) : 1;
    const pay = mockStore.payments.find(pm => Number(pm.id) === payId);
    if (pay) {
      const pt = mockStore.patients.find(p => Number(p.id) === Number(pay.patient_id) && (!doctorId || Number(p.doctor_id) === doctorId));
      return { rows: pt ? [pt] : [] };
    }
    return { rows: [] };
  }

  // Helper for mock status
  const isTreatedMock = (p) => {
    const pay = mockStore.payments.find(pm => Number(pm.patient_id) === Number(p.id));
    return pay ? pay.status === 'Paid' : false;
  };

  // Get patient stats
  if (queryStr.includes('count(*) as total_patients')) {
    const doctorId = params[0];
    const list = mockStore.patients.filter(p => Number(p.doctor_id) === Number(doctorId));
    const total_patients = list.length;
    const treated = list.filter(p => isTreatedMock(p)).length;
    const in_treatment = total_patients - treated;
    const total_earned = mockStore.payments.filter(pm => pm.status === 'Paid').reduce((sum, pm) => sum + Number(pm.amount || 0), 0);
    return { rows: [{ total_patients, in_treatment, treated, total_earned }] };
  }

  // Get patients
  if (queryStr.includes('from patients p')) {
    const doctorId = params[0];
    let list = mockStore.patients.filter(p => Number(p.doctor_id) === Number(doctorId));

    list = list.map(p => {
      const pay = mockStore.payments.find(pm => Number(pm.patient_id) === Number(p.id));
      const treated = isTreatedMock(p);
      const isPaid = pay ? pay.status === 'Paid' : false;
      return {
        ...p,
        status: treated ? 'Treated' : 'In Treatment',
        payment_status: isPaid ? 'Paid' : 'Pending',
        paid_amount: isPaid ? (pay ? pay.amount : p.amount) : 0
      };
    });

    if (params.length > 1) {
      for (let i = 1; i < params.length; i++) {
        const param = params[i];
        if (typeof param === 'string' && param.startsWith('%') && param.endsWith('%')) {
          const search = param.replace(/%/g, '').toLowerCase();
          list = list.filter(p =>
            p.first_name.toLowerCase().includes(search) ||
            (p.last_name && p.last_name.toLowerCase().includes(search)) ||
            p.phone.includes(search) ||
            p.patient_uid.toLowerCase().includes(search)
          );
        } else if (typeof param === 'string' && param !== 'All') {
          list = list.filter(p => p.status === param);
        }
      }
    }

    return { rows: list };
  }

  // Insert patient
  if (queryStr.includes('insert into patients')) {
    const maxId = mockStore.patients.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
    const newId = maxId + 1;
    const newPatient = {
      id: newId,
      doctor_id: params[0],
      patient_uid: params[1],
      first_name: params[2],
      last_name: params[3],
      phone: params[4],
      gender: params[5],
      dob: params[6],
      age: params[7],
      email: params[8],
      country: params[9],
      urgency_level: params[10],
      clinical_notes: params[11],
      preferred_appointment: params[12],
      treatment_type: params[13],
      status: 'In Treatment',
      amount: Number(params[14]) || 0,
      created_at: new Date().toISOString()
    };
    mockStore.patients.unshift(newPatient);
    return { rows: [newPatient] };
  }

  // Insert payment
  if (queryStr.includes('insert into payments')) {
    const maxPayId = mockStore.payments.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
    const newPay = {
      id: maxPayId + 1,
      patient_id: params[0],
      amount: Number(params[1]) || 0,
      status: params[2] || 'Pending',
      payment_date: new Date().toISOString()
    };
    mockStore.payments.push(newPay);
    return { rows: [newPay] };
  }

  // Update payment amount
  if (queryStr.includes('update payments set amount')) {
    const amount = Number(params[0]) || 0;
    const patientId = Number(params[1]);
    const pay = mockStore.payments.find(pm => Number(pm.patient_id) === patientId);
    if (pay) {
      pay.amount = amount;
    }
    return { rows: pay ? [pay] : [] };
  }

  // Select payment status by patient_id
  if (queryStr.includes('select status from payments where patient_id')) {
    const patientId = Number(params[0]);
    const pay = mockStore.payments.find(pm => Number(pm.patient_id) === patientId);
    return { rows: pay ? [{ status: pay.status }] : [] };
  }

  // Update patient — simple status update (2 params: status, id)
  if (queryStr.includes('update patients set status') && !queryStr.includes('first_name')) {
    const status = params[0];
    const id = Number(params[1]);
    const pt = mockStore.patients.find(p => Number(p.id) === id);
    if (pt) {
      pt.status = status;
      return { rows: [pt] };
    }
    return { rows: [] };
  }

  if (queryStr.includes('update patients') && queryStr.includes('set first_name')) {
    // params: [first_name, last_name, phone, gender, email, country, cleanAge, cleanDob, urgency_level, treatment_type,
    // clinical_notes, amount, cleanAppt, computedStatus, id, doctorId]
    const id = Number(params[14]);
    const doctorId = Number(params[15]);
    const pt = mockStore.patients.find(p => Number(p.id) === id && Number(p.doctor_id) === doctorId);
    if (pt) {
      if (params[0] !== undefined && params[0] !== null) pt.first_name = params[0];
      if (params[1] !== undefined && params[1] !== null) pt.last_name = params[1];
      if (params[2] !== undefined && params[2] !== null) pt.phone = params[2];
      if (params[3] !== undefined && params[3] !== null) pt.gender = params[3];
      if (params[4] !== undefined && params[4] !== null) pt.urgency_level = params[4];
      if (params[5] !== undefined && params[5] !== null) pt.treatment_type = params[5];
      if (params[6] !== undefined && params[6] !== null) pt.clinical_notes = params[6];
      if (params[7] !== undefined && params[7] !== null) pt.amount = Number(params[7]);
      if (params[8] !== undefined) pt.preferred_appointment = params[8];
      if (params[9] !== undefined && params[9] !== null) pt.status = params[9];
      return { rows: [pt] };
    }
    return { rows: [] };
  }

  // Delete patient
  if (queryStr.includes('delete from patients where id')) {
    const id = Number(params[0]);
    const doctorId = params[1] != null ? Number(params[1]) : null;
    const idx = mockStore.patients.findIndex(p =>
      Number(p.id) === id && (!doctorId || Number(p.doctor_id) === doctorId)
    );
    if (idx !== -1) {
      const deleted = mockStore.patients.splice(idx, 1);
      return { rows: deleted };
    }
    return { rows: [] };
  }

  // Delete payments
  if (queryStr.includes('delete from payments where patient_id')) {
    const patientId = Number(params[0]);
    mockStore.payments = mockStore.payments.filter(pm => Number(pm.patient_id) !== patientId);
    return { rows: [] };
  }

  // Get payments (left join equivalent)
  if (queryStr.includes('left join payments pay')) {
    const doctorId = params ? Number(params[0]) : 1;
    const list = mockStore.patients
      .filter(p => !doctorId || Number(p.doctor_id) === doctorId)
      .map(p => {
        const pay = mockStore.payments.find(pm => Number(pm.patient_id) === Number(p.id)) || {};
        return {
          id: pay.id || p.id,
          patient_id: p.id,
          amount: pay.amount !== undefined ? pay.amount : (p.amount || 0),
          status: pay.status || 'Pending',
          payment_date: pay.payment_date || p.created_at || new Date().toISOString(),
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          phone: p.phone || '',
          patient_uid: p.patient_uid || '',
          treatment_type: p.treatment_type || '',
          preferred_appointment: p.preferred_appointment || null
        };
    });
    return { rows: list };
  }

  // Update payment status
  if (queryStr.includes('update payments set status')) {
    const status = params[0];
    const targetId = Number(params[1]);
    const targetPatientId = params[2] ? Number(params[2]) : targetId;

    let pay = mockStore.payments.find(pm => Number(pm.id) === targetId || Number(pm.patient_id) === targetPatientId);
    if (!pay) {
      // Upsert mock payment
      const pt = mockStore.patients.find(p => Number(p.id) === targetPatientId || Number(p.id) === targetId);
      const maxPayId = mockStore.payments.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
      pay = {
        id: maxPayId + 1,
        patient_id: pt ? pt.id : targetPatientId,
        amount: pt ? pt.amount : 0,
        status: status,
        payment_date: new Date().toISOString()
      };
      mockStore.payments.push(pay);
    } else {
      pay.status = status;
    }

    const pt = mockStore.patients.find(p => Number(p.id) === Number(pay.patient_id));
    if (pt) {
      pt.status = isTreatedMock(pt) ? 'Treated' : 'In Treatment';
    }
    return { rows: [pay] };
  }

  return { rows: [] };
};

module.exports = {
  query: safeQuery,
  pool,
  mockStore
};
