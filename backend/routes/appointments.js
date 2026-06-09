const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/appointments
// @desc    Book a new appointment
// @access  Private (patient)
router.post('/', protect, async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot, reason, notes } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide doctorId, appointmentDate, timeSlot, and reason.',
      });
    }

    // Verify doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Ensure appointment date is not in the past
    const apptDate = new Date(appointmentDate);
    apptDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (apptDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be in the past.',
      });
    }

    // Check if patient already has an appointment with this doctor on same date/time
    const patientId = req.user._id;
    const existingPatientAppt = await Appointment.findOne({
      patient: patientId,
      doctor: doctorId,
      appointmentDate: apptDate,
      timeSlot,
      status: 'booked',
    });

    if (existingPatientAppt) {
      return res.status(409).json({
        success: false,
        message: 'You already have a booked appointment with this doctor at the same time.',
      });
    }

    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      appointmentDate: apptDate,
      timeSlot,
      reason,
      notes,
      patientNotes: notes,
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      appointment: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked for the selected doctor.',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/appointments
// @desc    Get appointments (filtered by role)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, doctorId, patientId, date } = req.query;
    let filter = {};

    // Patients see their own; doctors see their own; can be extended for admin
    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.doctor = req.user._id;
    }

    // Optional filters
    if (status) filter.status = status;
    if (doctorId && req.user.role !== 'patient') filter.doctor = doctorId;
    if (patientId && req.user.role !== 'patient') filter.patient = patientId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.appointmentDate = { $gte: d, $lt: next };
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone gender dateOfBirth')
      .populate('doctor', 'name email specialization phone')
      .sort({ appointmentDate: 1, timeSlot: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get a single appointment by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Only involved parties can view
    const userId = req.user._id.toString();
    if (
      appointment.patient._id.toString() !== userId &&
      appointment.doctor._id.toString() !== userId
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/appointments/:id/cancel
// @desc    Cancel an appointment
// @access  Private (patient or doctor involved)
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Only involved patient or doctor can cancel
    const userId = req.user._id.toString();
    if (
      appointment.patient.toString() !== userId &&
      appointment.doctor.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this appointment.',
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled.',
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed appointment.',
      });
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user._id;
    appointment.cancellationReason = cancellationReason || 'No reason provided';
    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization')
      .populate('cancelledBy', 'name role');

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully.',
      appointment: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/appointments/:id/complete
// @desc    Mark appointment as completed (doctor only)
// @access  Private (doctor)
router.patch('/:id/complete', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (req.user.role !== 'doctor' || appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned doctor can mark this appointment as completed.',
      });
    }

    if (appointment.status !== 'booked') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete an appointment with status '${appointment.status}'.`,
      });
    }

    appointment.status = 'completed';
    if (req.body.notes) appointment.doctorNotes = req.body.notes;
    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization');

    res.status(200).json({
      success: true,
      message: 'Appointment marked as completed.',
      appointment: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
