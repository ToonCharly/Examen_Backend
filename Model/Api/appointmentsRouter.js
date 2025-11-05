const express = require('express');

/**
 * Factory to create router wired to a service instance
 * @param {AppointmentService} service
 */
function createAppointmentsRouter(service) {
  const router = express.Router();

  // List all
  router.get('/', async (req, res) => {
    try {
      const items = await service.list();
      res.json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Get by ID
  router.get('/:id', async (req, res) => {
    try {
      const item = await service.get(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Create
  router.post('/', async (req, res) => {
    try {
      const created = await service.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      console.error(err);
      if (err.code === 'VALIDATION_ERROR') return res.status(400).json({ error: err.message });
      if (err.code === 'CONFLICT') return res.status(409).json({ error: err.message });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Update
  router.put('/:id', async (req, res) => {
    try {
      const updated = await service.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (err) {
      console.error(err);
      if (err.code === 'VALIDATION_ERROR') return res.status(400).json({ error: err.message });
      if (err.code === 'CONFLICT') return res.status(409).json({ error: err.message });
      if (err.code === 'NOT_FOUND') return res.status(404).json({ error: err.message });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Cancel
  router.post('/:id/cancel', async (req, res) => {
    try {
      const cancelled = await service.cancel(req.params.id);
      if (!cancelled) return res.status(404).json({ error: 'Not found' });
      res.json(cancelled);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Delete
  router.delete('/:id', async (req, res) => {
    try {
      const removed = await service.delete(req.params.id);
      if (!removed) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
}

module.exports = createAppointmentsRouter;
