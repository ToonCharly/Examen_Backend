require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connect } = require('./Model/Database/connection');
const AppointmentService = require('./Model/Services/appointmentService');
const createAppointmentsRouter = require('./Model/Api/appointmentsRouter');

const PORT = process.env.PORT || 3000;

async function start() {
  await connect();

  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  const service = new AppointmentService();

  // Example observer: log events (replace with socket emitters if needed)
  service.addObserver({
    update: (event, data) => {
      console.log('EVENT:', event, data && data.appointmentId ? data.appointmentId : data && data._id ? data._id : '');
    },
  });

  app.get('/', (req, res) => res.json({ status: 'ok', now: new Date() }));

  app.use('/api/appointments', createAppointmentsRouter(service));

  app.use((err, req, res, next) => {
    console.error('Unhandled error', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
}

start().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
