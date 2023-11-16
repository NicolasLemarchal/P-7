const Book = require('../models/Book');
const sharp = require('sharp');
const fs = require('fs');

// Fonction utilitaire pour calculer la note moyenne
function calculateAverageRating(ratings) {
  if (ratings.length === 0) return 0;
  const totalRating = ratings.reduce((sum, rating) => sum + rating.grade, 0);
  return totalRating / ratings.length;
}

exports.createBook = async (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject.userId;

    const imagePath = `./images/${req.file.filename}`;
    const webpImagePath = `./images/${req.file.filename.replace(/\.[^/.]+$/, "")}.webp`;
    await sharp(imagePath).toFormat('webp').toFile(webpImagePath);

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename.replace(/\.[^/.]+$/, "")}.webp`
    });

    await book.save();
    fs.unlinkSync(imagePath);

    res.status(201).json({ message: 'Objet enregistré !' });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.modifyBook = (req, res, next) => {
  const { title, author, imageUrl, year, genre } = req.body;
  const bookObject = req.file
    ? {
        title,
        author,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        year,
        genre,
      }
    : { title, author, imageUrl, year, genre };

  Book.findByIdAndUpdate(req.params.id, { ...bookObject }, { new: true })
    .then(updatedBook => res.status(200).json({ message: 'Livre modifié avec succès', book: updatedBook }))
    .catch(err => res.status(401).json({ message: err.message }));
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (book.userId !== req.auth.userId) {
        res.status(401).json({ message: 'Non-autorisé' });
      } else {
        const filename = book.imageUrl.split('/images')[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Livre supprimé avec succès' }))
            .catch(err => res.status(401).json({ message: err.message }));
        });
      }
    })
    .catch(err => res.status(500).json({ message: err.message }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => res.status(400).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};

exports.getBestRatedBooks = (req, res, next) => {
  Book.find().sort({ averageRating: -1 }).limit(3)
    .then(bestRatedBooks => res.status(200).json(bestRatedBooks))
    .catch(err => res.status(500).json({ message: err.message }));
};

exports.addRatingToBook = (req, res, next) => {
  const { userId, rating } = req.body;
  Book.findById(req.params.id)
    .then(book => {
      const existingRating = book.ratings.find(r => r.userId === userId);
      if (existingRating) {
        return res.status(400).json({ message: 'Vous avez déjà noté ce livre' });
      }

      book.ratings.push({ userId, grade: rating });
      book.averageRating = calculateAverageRating(book.ratings);

      book.save()
        .then(savedBook => res.status(200).json({ message: 'Note ajoutée avec succès', book: savedBook }))
        .catch(err => res.status(401).json({ message: err.message }));
    })
    .catch(err => res.status(401).json({ message: err.message }));
};
