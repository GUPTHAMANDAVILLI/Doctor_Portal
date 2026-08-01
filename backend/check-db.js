const { pool, mockStore } = require('./src/config/db');

async function checkDatabase() {
  console.log('🔍 Checking PostgreSQL Database Status...\n');

  try {
    const doctorsRes = await pool.query('SELECT id, name, email, specialization FROM doctors');
    console.log('👨‍⚕️ Doctors Table Records:', doctorsRes.rows.length);
    console.table(doctorsRes.rows);

    const patientsRes = await pool.query('SELECT id, doctor_id, patient_uid, first_name, phone, treatment_type, urgency_level, amount, status, created_at FROM patients ORDER BY id DESC');
    console.log('\n📋 Patients Table Records:', patientsRes.rows.length);
    if (patientsRes.rows.length > 0) {
      console.table(patientsRes.rows);
    } else {
      console.log('   (No patient records in PostgreSQL database yet)');
    }

    const paymentsRes = await pool.query('SELECT id, patient_id, amount, status, payment_date FROM payments ORDER BY id DESC');
    console.log('\n💳 Payments Table Records:', paymentsRes.rows.length);
    if (paymentsRes.rows.length > 0) {
      console.table(paymentsRes.rows);
    } else {
      console.log('   (No payment records in PostgreSQL database yet)');
    }

    console.log('\n----------------------------------------');
    console.log('📦 Mock Store In-Memory Status (Fallback):');
    console.log('   Doctors Count:', mockStore.doctors.length);
    console.log('   Patients Count:', mockStore.patients.length);
    console.log('   Payments Count:', mockStore.payments.length);

    process.exit(0);
  } catch (err) {
    console.error('⚠️ PostgreSQL database connection error:', err.message);
    console.log('\n----------------------------------------');
    console.log('📦 Mock Store In-Memory Status (Active):');
    console.log('   Doctors Count:', mockStore.doctors.length);
    console.log('   Patients Count:', mockStore.patients.length);
    console.log('   Payments Count:', mockStore.payments.length);
    process.exit(0);
  }
}

checkDatabase();
