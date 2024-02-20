import * as express from "express";
import * as bcrypt from "bcryptjs";
import { collections } from "./database";
import { ObjectId } from "mongodb";
import { ObjectIdLike } from "bson";

const userRouter = express.Router();

userRouter.use(express.json());

userRouter.get('/:id', async (req, res) => {
    const userId = req.params.id;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    if (!isValidObjectId) {
        return res.status(400).json({ error: "Invalid user ID format. User ID must be a 24 character hex string." });
    }

    if (!collections.users) {
        return res.status(500).json({ error: "User collection not initialized." });
    }

    try {
        const user = await collections.users.findOne({ _id: new ObjectId(userId) });
        
        if (!user) {
            res.status(404).json({ message: "User not found" });
        } else {
            res.status(200).json(user);
        }
    } catch (error) {
        console.error("Failed to fetch user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

userRouter.post('/', async (req, res) => {
    if (!collections.users) {
        return res.status(500).json({ error: "User collection not initialized." });
    }

    try {
        const { firstname, lastname, role, email, passwordHash, assignedlocations, assignedzones, clientid } = req.body;
        const hashedPassword = await bcrypt.hash(passwordHash, 8);
        const newUser = { firstname, lastname, role, email, passwordHash: hashedPassword, assignedlocations, assignedzones, clientid };
        const result = await collections.users.insertOne(newUser);

        if (result.acknowledged) {
            res.status(201).json({ _id: result.insertedId, message: "User created successfully" });
        } else {
            throw new Error('User creation failed');
        }
    } catch (error) {
        console.error("Failed to create user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

userRouter.post('/fetchByIds', async (req, res) => {
    if (!collections.users) {
        return res.status(500).json({ error: "User collection not initialized." });
    }

    try {
        const { ids } = req.body;
        const objectIds = ids.map((id: string | number | ObjectId | ObjectIdLike | Uint8Array) => new ObjectId(id));
        const users = await collections.users.find({ _id: { $in: objectIds }}).toArray();

        res.status(200).json(users);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

userRouter.put('/:id', async (req, res) => {
    if (!collections.users) {
        return res.status(500).json({ error: "User collection not initialized." });
    }

    try {
        const userId = req.params.id;
        const { firstname, lastname, role, email, assignedlocations, assignedzones } = req.body;
        const updateResult = await collections.users.updateOne({ _id: new ObjectId(userId) }, { $set: { firstname, lastname, role, email, assignedlocations, assignedzones }});

        if (updateResult.matchedCount === 0) {
            res.status(404).json({ error: "User not found" });
        } else {
            res.status(200).json({ message: "User updated successfully" });
        }
    } catch (error) {
        console.error("Failed to update user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

userRouter.delete('/:id', async (req, res) => {
    if (!collections.users) {
        return res.status(500).json({ error: "User collection not initialized." });
    }

    try {
        const userId = req.params.id;
        const deleteResult = await collections.users.deleteOne({ _id: new ObjectId(userId) });

        if (deleteResult.deletedCount === 0) {
            res.status(404).json({ error: "User not found" });
        } else {
            res.status(200).json({ message: "User deleted successfully" });
        }
    } catch (error) {
        console.error("Failed to delete user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default userRouter;
