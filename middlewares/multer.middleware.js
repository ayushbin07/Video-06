import multer from "multer";

const storage = multer.diskStorage({
  // Chooses the temporary folder where uploaded files are stored before processing.
  destination: function (req, res, cb) {
    cb(null, "./public/temp");
  },
  // Chooses the name that Multer gives to each uploaded file.
  filename: function (req, file, cb) {
    cb(null, file.originalName);
  },
});

const upload = multer({ storage });

export { upload };
