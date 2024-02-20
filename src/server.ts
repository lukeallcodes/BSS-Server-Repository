import * as dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { connectToDatabase } from "./database";
import { clientRouter } from "./client.routes";
import authRouter from "./auth.routes";
// import your middleware
import validateJWT from "./middleware"; // Correct import for a default export
import userRouter from "./user.routes";


// Load environment variables from the .env file, where the ATLAS_URI is configured
dotenv.config();

const { ATLAS_URI } = process.env;

if (!ATLAS_URI) {
    console.error("No ATLAS_URI environment variable has been defined in config.env");
    process.exit(1);
}

connectToDatabase(ATLAS_URI)
    .then(() => {
        const app = express();
        app.use(cors());
        app.use(express.json()); // To parse JSON request bodies
        app.use("/auth", authRouter);
        app.use("/clients", clientRouter); // Apply the validateJWT middleware to client routes
        app.use("/users", userRouter);
        // start the Express server
        app.listen(5200, () => {
            console.log(`Server running at http://localhost:5200...`);
        });
    })
    .catch(error => console.error(error));
