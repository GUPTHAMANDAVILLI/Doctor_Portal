const db = require('../config/db');

// GET /api/payments - Get all payments for doctor's patients
const getPayments = async (req, res) => {
  try {
    const doctorId = req.doctor.id;

    const result = await db.query(`
      SELECT
        COALESCE(pay.id, p.id) as id,
        p.id as patient_id,
        COALESCE(pay.amount, p.amount, 0) as amount,
        COALESCE(pay.status, 'Pending') as status,
        COALESCE(pay.payment_date, p.created_at) as payment_date,
        p.first_name,
        p.last_name,
        p.phone,
        p.patient_uid,
        p.treatment_type,
        p.preferred_appointment
      FROM patients p
      LEFT JOIN payments pay ON pay.patient_id = p.id
      WHERE p.doctor_id = $1
      ORDER BY COALESCE(pay.payment_date, p.created_at) DESC
    `, [doctorId]);

    // Summary stats
    const totalEarned = result.rows
      .filter(r => r.status === 'Paid')
      .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    const totalPending = result.rows
      .filter(r => r.status === 'Pending')
      .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    res.status(200).json({
      success: true,
      payments: result.rows,
      summary: { total_earned: totalEarned, total_pending: totalPending }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PATCH /api/payments/:id - Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const doctorId = parseInt(req.doctor.id) || 1;

    if (!['Paid', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Paid or Pending.' });
    }

    // Check if patient exists and belongs to doctor
    let ptResult = await db.query(
      'SELECT id, amount, preferred_appointment FROM patients WHERE id = $1 AND doctor_id = $2',
      [id, doctorId]
    );

    let patient = ptResult.rows[0];

    if (!patient) {
      // Check if id is a payment ID
      const payResult = await db.query(
        'SELECT p.id, p.amount, p.preferred_appointment FROM payments pay JOIN patients p ON p.id = pay.patient_id WHERE pay.id = $1 AND p.doctor_id = $2',
        [id, doctorId]
      );
      if (payResult.rows.length > 0) {
        patient = payResult.rows[0];
      }
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Payment record not found or unauthorized.' });
    }

    // Try updating existing payment first
    let result = await db.query(
      'UPDATE payments SET status = $1 WHERE id = $2 OR patient_id = $3 RETURNING *',
      [status, id, patient.id]
    );

    // If no payment record exists yet, insert one
    if (result.rows.length === 0) {
      result = await db.query(
        'INSERT INTO payments (patient_id, amount, status) VALUES ($1, $2, $3) RETURNING *',
        [patient.id, patient.amount || 0, status]
      );
    }

    const updatedPayment = result.rows[0];

    // Synchronize status logic: Treated if Paid
    const isPaid = status === 'Paid';
    const patientStatus = isPaid ? 'Treated' : 'In Treatment';

    await db.query(
      'UPDATE patients SET status = $1 WHERE id = $2',
      [patientStatus, patient.id]
    );

    res.status(200).json({ success: true, payment: updatedPayment });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getPayments, updatePaymentStatus };
