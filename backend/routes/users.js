const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');

// @route   GET /api/users/patients
// @desc    Get all patients
// @access  Private
router.get('/patients', protect, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access patient records.',
      });
    }

    const patientIds = await Appointment.distinct('patient', {
      doctor: req.user._id,
    });

    const patients = await User.find({
      role: 'patient',
      isActive: true,
      _id: { $in: patientIds },
    })
      .where('_id')
      .in(patientIds)
      .select('-password')
      .sort({ createdAt: -1 });

    const latestAppointments = await Appointment.find({
      doctor: req.user._id,
      patient: { $in: patientIds },
    })
      .sort({ createdAt: -1 })
      .populate('patient', 'name email phone gender dateOfBirth')
      .populate('doctor', 'name email specialization phone')
      .lean();

    const latestAppointmentByPatient = new Map();
    const appointmentsByPatient = new Map();
    for (const appointment of latestAppointments) {
      const patientKey = appointment.patient?._id?.toString?.() || appointment.patient?.toString?.();
      if (!patientKey) continue;

      if (!appointmentsByPatient.has(patientKey)) {
        appointmentsByPatient.set(patientKey, []);
      }
      appointmentsByPatient.get(patientKey).push(appointment);

      if (!latestAppointmentByPatient.has(patientKey)) {
        latestAppointmentByPatient.set(patientKey, appointment);
      }
    }

    const patientsWithNotes = patients.map((patient) => {
      const latestAppointment = latestAppointmentByPatient.get(patient._id.toString()) || null;
      const appointments = appointmentsByPatient.get(patient._id.toString()) || [];
      return {
        ...patient.toObject(),
        latestAppointment,
        appointments,
      };
    });

    res.status(200).json({
      success: true,
      count: patientsWithNotes.length,
      patients: patientsWithNotes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/users/doctors
// @desc    Get all doctors
// @access  Private
router.get('/doctors', protect, async (req, res) => {
  try {
    const { specialization } = req.query;
    const filter = { role: 'doctor', isActive: true };
    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' };
    }

    const doctors = await User.find(filter)
      .select('-password')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get a specific user by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (req.user.role === 'patient' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    if (req.user.role === 'doctor') {
      if (user._id.toString() === req.user._id.toString()) {
        return res.status(200).json({ success: true, user });
      }

      if (user.role !== 'patient') {
        return res.status(403).json({
          success: false,
          message: 'Doctors can only access patient records.',
        });
      }

      const hasCompletedAppointment = await Appointment.exists({
        doctor: req.user._id,
        patient: user._id,
        status: 'completed',
      });

      if (!hasCompletedAppointment) {
        return res.status(403).json({
          success: false,
          message: 'You can only view patients you have treated.',
        });
      }
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
