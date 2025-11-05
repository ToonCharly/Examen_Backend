const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const AppointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    patientName: { type: String, required: true, trim: true },
    doctorName: { type: String, required: true, trim: true },
    // date only (yyyy-mm-dd) - store as Date at midnight for easier queries
    date: { type: Date, required: true },
    // time as string like '09:30' - keep simple for scheduling slots
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent same doctor having two appointments at same date+time
AppointmentSchema.index({ doctorName: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
