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
    const webpImagePath = `./images/${req.file.filename.replace(/\.[^/.]+$/, '')}.webp`;
    
    await sharp(imagePath)
      .resize(206, 260)
      .toFormat('webp')
      .toFile(webpImagePath);

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}${webpImagePath.slice(1)}`
    });

    await book.save();
    fs.unlinkSync(imagePath);

    res.status(201).json({ message: 'Objet enregistré !' });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.modifyBook = async (req, res, next) => {
  try {
    const { title, author, year, genre } = req.body;
    const bookObject = req.file
      ? {
          title,
          author,
          year,
          genre,
        }
      : { title, author, year, genre };

    if (req.file) {
      const oldBook = await Book.findById(req.params.id);
      const oldImagePath = `./images/${oldBook.imageUrl.split('/images/')[1]}`;
      fs.unlinkSync(oldImagePath);

      const imagePath = `./images/${req.file.filename}`;
      const webpImagePath = `./images/${req.file.filename.replace(/\.[^/.]+$/, '')}.webp`;
      
      await sharp(imagePath)
        .resize(206, 260)
        .toFormat('webp')
        .toFile(webpImagePath);

      bookObject.imageUrl = `${req.protocol}://${req.get('host')}${webpImagePath.slice(1)}`;

      fs.unlinkSync(imagePath);
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, { ...bookObject }, { new: true });
    res.status(200).json({ message: 'Livre modifié avec succès', book: updatedBook });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
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

exports.addRatingToBook = async (req, res, next) => {
  const { userId, rating } = req.body;
  const bookId = req.params.id;

  try {
    const book = await Book.findById(bookId);

    const existingRating = book.ratings.find(r => r.userId === userId);
    if (existingRating) {
      return res.status(400).json({ error: 'Vous avez déjà noté ce livre' });
    }

    book.ratings.push({ userId, grade: rating });
    book.averageRating = calculateAverageRating(book.ratings);

    await book.save();
    res.status(200).json(book);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
