require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server: SocketIO } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connect } = require('./Model/Database/connection');
const AppointmentService = require('./Model/Services/appointmentService');
const createAppointmentsRouter = require('./Model/Api/appointmentsRouter');

// new repos/routers for pacientes/medicos/citas
const PacienteRepository = require('./Model/Repository/pacienteRepository');
const MedicoRepository = require('./Model/Repository/medicoRepository');
const CitaRepository = require('./Model/Repository/citaRepository');
const createPacientesRouter = require('./Model/Api/pacientesRouter');
const createMedicosRouter = require('./Model/Api/medicosRouter');
const createCitasRouter = require('./Model/Api/citasRouter');

const PORT = process.env.PORT || 3000;

async function start() {
  await connect();

  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  const service = new AppointmentService();
  const pacienteRepo = new PacienteRepository();
  const medicoRepo = new MedicoRepository();
  const citaRepo = new CitaRepository();

  // Create HTTP server and attach socket.io for realtime
  const httpServer = http.createServer(app);
  const io = new SocketIO(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', socket => {
    console.log('🔌 Client connected', socket.id);
    socket.on('disconnect', () => console.log('🔌 Client disconnected', socket.id));
  });

  // Observers: forward repository/service events to connected websocket clients
  const forwardToSockets = {
    update: (event, data) => {
      try {
        io.emit(event, data);
        console.log('WS EMIT', event, data && (data.appointmentId || data._id) ? (data.appointmentId || data._id) : '');
      } catch (err) {
        console.error('Error emitting socket event', err.message);
      }
    },
  };

  service.addObserver(forwardToSockets);
  pacienteRepo.addObserver(forwardToSockets);
  medicoRepo.addObserver(forwardToSockets);
  citaRepo.addObserver(forwardToSockets);

  app.get('/', (req, res) => res.json({ status: 'ok', now: new Date() }));

  app.use('/api/appointments', createAppointmentsRouter(service));
  app.use('/api/pacientes', createPacientesRouter(pacienteRepo));
  app.use('/api/medicos', createMedicosRouter(medicoRepo));
  app.use('/api/citas', createCitasRouter(citaRepo));

  const errorHandler = require('./Model/Api/errorHandler');
  app.use(errorHandler);
  httpServer.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
}

start().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
