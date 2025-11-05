const express = require('express');
const { pacienteValidators, checkValidation } = require('./validators');

function createPacientesRouter(repo) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const list = await repo.listAll();
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

  router.post('/', pacienteValidators.create, checkValidation, async (req, res, next) => {
    try {
      const created = await repo.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', pacienteValidators.update, checkValidation, async (req, res, next) => {
    try {
      const updated = await repo.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const removed = await repo.delete(req.params.id);
      if (!removed) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
}

module.exports = createPacientesRouter;
