import multer from "multer";

const storage = multer.diskStorage({
  // Chooses the temporary folder where uploaded files are stored before processing.
  destination: function (req, res, cb) {
    cb(null, "./public/temp");
  },
  // Chooses the name that Multer gives to each uploaded file.
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

const tweetMediaUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
      return;
    }

    cb(new Error("Only image and video files are allowed"));
  },
});

export { upload, tweetMediaUpload };
