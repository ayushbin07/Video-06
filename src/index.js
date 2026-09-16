import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "../db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    // Starts the HTTP server after the database connection succeeds.
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port: ${process.env.PORT}`);
    });

    // Reports errors emitted by the Express application.
    app.on("error", (error) => {
      console.log("ERR: ", error);
      throw error;
    });
  })
  .catch((err) => {
    // Reports a database connection failure during application startup.
    console.log("Mongo DB connection failed !!!", err);
  });

/*
//1st approach
import express from "express";

const app = express();

;(async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (err) => {
            console.log("ERROR: ", err)
            throw err
        })
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`)
        })

    } catch (error) {
        console.log("ERROR: ", error)
        throw err
    }
})()
*/
