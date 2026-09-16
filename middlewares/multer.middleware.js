import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalName);
  },
});

const upload = multer({ storage });
