import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createNoteSchema, updateNoteSchema } from '../validators/note.schema.js';
import * as c from '../controllers/notes.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', c.index);
router.post('/', validate(createNoteSchema), c.create);
router.get('/:id', c.show);
router.patch('/:id', validate(updateNoteSchema), c.update);
router.delete('/:id', c.destroy);

export default router;
