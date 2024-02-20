import * as express from "express";
import { collections } from "./database";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const authRouter = express.Router();
authRouter.use(express.json());

// Ensure collections.users is defined before proceeding
const usersCollection = collections.users;
if (!usersCollection) {
    throw new Error("Database not initialized properly - users collection is undefined");
}

// User Registration
authRouter.post("/register", async (req, res) => {
    try {
        const { firstname, lastname, role, email, password, assignedlocations, assignedzones } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10); // Hashing the password

        const newUser = {
            firstname,
            lastname,
            role,
            email,
            passwordHash: hashedPassword, // Use passwordHash instead of password
            assignedlocations,
            assignedzones,
        };

        const result = await usersCollection.insertOne(newUser);
        if (!result) {
            return res.status(500).send('Failed to create user');
        }
        // Inside your /register route
        res.status(201).json({ message: `User created with ID: ${result.insertedId}` });

    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send('An unknown error occurred');
        }
    }
});

// User Login
authRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await usersCollection.findOne({ email });

        if (user && await bcrypt.compare(password, user.passwordHash)) {
            // Generate and send token
            const token = jwt.sign({ userId: user._id, role: user.role }, 'your-secret-key', { expiresIn: '1h' });
            res.status(200).send({ token, role: user.role, clientid: user.clientid, userID: user._id }); // Send back the token and the role
        } else {
            res.status(400).send("Invalid email or password");
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send('An unknown error occurred');
        }
    }
});

// Additional routes can be added here if needed

export default authRouter;
