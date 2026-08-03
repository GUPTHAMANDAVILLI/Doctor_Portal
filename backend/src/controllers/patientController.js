const db = require('../config/db');

const generatePatientUID = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0,10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `UMR${dateStr}-${rand}`;
};

// GET /api/patients
const getPatients = async (req, res) => {
  try {
    const doctorId = parseInt(req.doctor.id) || 1;
    const { status, search } = req.query || {};

    let query = `
      SELECT p.*,
        pay.status as payment_status,
        pay.amount as paid_amount,
        CASE
          WHEN pay.status = 'Paid' THEN 'Treated'
          ELSE 'In Treatment'
        END as computed_status
      FROM patients p
      LEFT JOIN payments pay ON pay.patient_id = p.id
      WHERE p.doctor_id = $1
    `;
    const params = [doctorId];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.first_name ILIKE $${params.length} OR p.last_name ILIKE $${params.length} OR p.phone ILIKE $${params.length} OR p.patient_uid ILIKE $${params.length})`;
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await db.query(query, params);

    let patients = result.rows.map(p => ({
      ...p,
      status: p.computed_status
    }));

    if (status && status !== 'All') {
      patients = patients.filter(p => p.status === status);
    }

    res.status(200).json({ success: true, patients });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /api/patients/stats
const getStats = async (req, res) => {
  try {
    const doctorId = parseInt(req.doctor.id) || 1;

    const statsResult = await db.query(`
      SELECT
        COUNT(*) as total_patients,
        COUNT(CASE WHEN pay.status = 'Paid' THEN 1 END) as treated,
        COUNT(CASE WHEN pay.status != 'Paid' OR pay.status IS NULL THEN 1 END) as in_treatment,
        COALESCE(SUM(CASE WHEN pay.status = 'Paid' THEN pay.amount ELSE 0 END), 0) as total_earned
      FROM patients p
      LEFT JOIN payments pay ON pay.patient_id = p.id
      WHERE p.doctor_id = $1
    `, [doctorId]);

    res.status(200).json({ success: true, stats: statsResult.rows[0] });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// POST /api/patients - Capture Lead
const createPatient = async (req, res) => {
  try {
    const doctorId = parseInt(req.doctor.id) || 1;
    const {
      first_name, last_name, phone, gender, dob, age, email, country,
      urgency_level, clinical_notes, preferred_appointment,
      treatment_type, amount
    } = req.body;

    if (!first_name || !phone) {
      return res.status(400).json({ success: false, message: 'First name and phone are required.' });
    }

    const patientUid = generatePatientUID();

    const cleanDob = (dob && dob.trim() !== '') ? dob : null;
    const cleanAppointment = (preferred_appointment && preferred_appointment.trim() !== '') ? preferred_appointment : null;
    const cleanAge = (age !== undefined && age !== null && age !== '') ? parseInt(age) : null;
    const cleanAmount = (amount !== undefined && amount !== null && amount !== '') ? parseFloat(amount) : 0;

    const result = await db.query(`
      INSERT INTO patients (
        doctor_id, patient_uid, first_name, last_name, phone, gender, dob, age,
        email, country, urgency_level, clinical_notes, preferred_appointment,
        treatment_type, status, amount
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'In Treatment',$15)
      RETURNING *
    `, [
      doctorId, patientUid, first_name, last_name || null, phone,
      gender || null, cleanDob, cleanAge, email || null,
      country || 'India', urgency_level || 'Routine',
      clinical_notes || null, cleanAppointment,
      treatment_type || 'ENT Treatment', cleanAmount
    ]);

    const newPatient = result.rows[0];

    // Insert pending payment entry
    await db.query(
      'INSERT INTO payments (patient_id, amount, status) VALUES ($1, $2, $3)',
      [newPatient.id, cleanAmount, 'Pending']
    );

    res.status(201).json({ success: true, message: 'Patient captured successfully.', patient: newPatient });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PUT /api/patients/:id - Edit Patient
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = parseInt(req.doctor.id) || 1;
    const {
      first_name, last_name, phone, gender, dob, age, email, country,
      urgency_level, treatment_type, clinical_notes, amount, preferred_appointment
    } = req.body;

    const cleanAppt = (preferred_appointment !== undefined) 
      ? ((preferred_appointment && String(preferred_appointment).trim() !== '') ? preferred_appointment : null) 
      : undefined;

    const cleanDob = (dob !== undefined)
      ? ((dob && String(dob).trim() !== '') ? dob : null)
      : undefined;

    const cleanAge = (age !== undefined && age !== null && age !== '') ? parseInt(age) : undefined;

    // Also update payments table amount
    if (amount !== undefined) {
      await db.query('UPDATE payments SET amount = $1 WHERE patient_id = $2', [amount, id]);
    }

    const payResult = await db.query('SELECT status FROM payments WHERE patient_id = $1 ORDER BY id DESC LIMIT 1', [id]);
    const isPaid = payResult.rows.length > 0 && payResult.rows[0].status === 'Paid';
    const computedStatus = isPaid ? 'Treated' : 'In Treatment';

    const result = await db.query(`
      UPDATE patients
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          phone = COALESCE($3, phone),
          gender = COALESCE($4, gender),
          email = COALESCE($5, email),
          country = COALESCE($6, country),
          age = COALESCE($7, age),
          dob = CASE WHEN $8::text IS NOT NULL THEN $8::date ELSE dob END,
          urgency_level = COALESCE($9, urgency_level),
          treatment_type = COALESCE($10, treatment_type),
          clinical_notes = COALESCE($11, clinical_notes),
          amount = COALESCE($12, amount),
          preferred_appointment = CASE WHEN $13::text IS NOT NULL THEN $13::date ELSE preferred_appointment END,
          status = $14
      WHERE id = $15 AND doctor_id = $16
      RETURNING *
    `, [
      first_name, last_name, phone, gender, email, country, cleanAge, cleanDob,
      urgency_level, treatment_type, clinical_notes, amount, cleanAppt, computedStatus, id, doctorId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found or unauthorized.' });
    }

    const updatedPatient = {
      ...result.rows[0],
      payment_status: isPaid ? 'Paid' : 'Pending',
      status: computedStatus
    };

    res.status(200).json({ success: true, message: 'Patient updated successfully.', patient: updatedPatient });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE /api/patients/:id - Delete Patient
const deletePatient = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const doctorId = parseInt(req.doctor.id, 10) || 1;

    // Delete payments associated first
    await db.query('DELETE FROM payments WHERE patient_id = $1', [id]);
    const result = await db.query('DELETE FROM patients WHERE id = $1 AND doctor_id = $2 RETURNING *', [id, doctorId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found or unauthorized.' });
    }

    res.status(200).json({ success: true, message: 'Patient deleted successfully.' });
  } catch (error) {
    console.error(`Delete patient error for ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getPatients, getStats, createPatient, updatePatient, deletePatient };
