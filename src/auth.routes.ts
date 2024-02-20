import * as express from "express";
import { collections } from "./database";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // Corrected the spelling of 'bcryptjs'

export const authRouter = express.Router();
authRouter.use(express.json());
if(collection.users){
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
            assignedlocations: assignedlocations,
            assignedzones: assignedzones,
        };

        const result = await collections.users?.insertOne(newUser);
        // Inside your /register route
        res.status(201).json({ message: `User created with ID: ${result.insertedId}` });

    } catch (error) {
        res.status(500).send(error.message);
    }
});

// User Login
authRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await collections.users?.findOne({ email });

        if (user && await bcrypt.compare(password, user.passwordHash)) {
            // Generate and send token
            const token = jwt.sign({ userId: user._id, role: user.role }, 'your-secret-key', { expiresIn: '1h' });
            res.status(200).send({ token, role: user.role, clientid: user.clientid, userID: user._id }); // Send back the token and the role
        } else {
            res.status(400).send("Invalid email or password");
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});


// Additional routes can be added here if needed
}
export default authRouter;
    
