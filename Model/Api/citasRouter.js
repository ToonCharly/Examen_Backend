const express = require('express');
const { citaValidators, checkValidation } = require('./validators');

function createCitasRouter(repo) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const { estado, desde } = req.query;
      const list = (estado || desde) ? await repo.listByFilter({ estado, desde }) : await repo.listAll();
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const item = await repo.getById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.post('/', citaValidators.create, checkValidation, async (req, res, next) => {
    try {
      const created = await repo.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', citaValidators.update, checkValidation, async (req, res, next) => {
    try {
      const updated = await repo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // Soft-delete: mark cita as Cancelada to preserve history
  router.delete('/:id', async (req, res, next) => {
    try {
      const updated = await repo.update(req.params.id, { estado: 'Cancelada' });
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true, cita: updated });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createCitasRouter;
