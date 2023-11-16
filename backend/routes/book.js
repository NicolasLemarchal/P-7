const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

const bookCtrl = require('../controllers/book');

router.get('/', bookCtrl.getAllBooks); //Fonctionne
router.get('/bestrating', bookCtrl.getBestRatedBooks); //Fonctionne
router.get('/:id', bookCtrl.getOneBook); //Fonctionne

router.post('/', auth, multer, bookCtrl.createBook); //Fonctionne
router.post('/:id/rating', auth, bookCtrl.addRatingToBook); //Fonctionne

router.put('/:id', auth, multer, bookCtrl.modifyBook); //Fonctionne

router.delete('/:id', auth, bookCtrl.deleteBook); //Fonctionne

module.exports = router;
