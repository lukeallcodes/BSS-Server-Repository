import * as express from "express";
import * as mongodb from "mongodb";
import { collections } from "./database";
import { Client, Location, Zone } from "./client";
import QRCode from 'qrcode';

export const clientRouter = express.Router();
clientRouter.use(express.json());

// Get all clients
clientRouter.get("/", async (_req, res) => {
    try {
        const clients = await collections.clients.find({}).toArray();
        console.log("Get all clients:", clients); // Add this logging statement
        res.status(200).send(clients);
    } catch (error) {
        console.error("Error while getting all clients:", error); // Add this logging statement
        res.status(500).send(error.message);
    }
});

// Get a single client by ID
// Inside clientRouter.get("/:id")
clientRouter.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const query = { _id: new mongodb.ObjectId(id) };
        const client = await collections.clients.aggregate([
            { $match: query }
        ]).toArray();

        if (client && client.length > 0) {
            res.status(200).send(client[0]);
        } else {
            res.status(404).send(`Failed to find a client with ID ${id}`);
        }
    } catch (error) {
        console.error("Error while getting client by ID:", error);
        res.status(500).send(error.message);
    }
});

clientRouter.post("/", async (req, res) => {
    try {
        const { clientname } = req.body;
        // Initialize userRefs as an empty array when creating a new client
        const client: Partial<Client> = {
            clientname,
            userRefs: [] // Ensure userRefs is initialized as an empty array
        };

        const result = await collections.clients.insertOne(client as Client);

        if (result.insertedId) {
            console.log("Created a new client with ID:", result.insertedId);
            res.status(201).send(`Created a new client with ID ${result.insertedId}.`);
        } else {
            console.error("Failed to create a new client.");
            res.status(500).send("Failed to create a new client.");
        }
    } catch (error) {
        console.error("Error while creating a new client:", error);
        res.status(400).send(error.message);
    }
});


clientRouter.put("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        let clientData = req.body;

        // Remove the _id field from clientData to avoid modifying it directly
        delete clientData._id;

        // Convert userRefs to an array of MongoDB ObjectIDs if provided
        if (clientData.userRefs && Array.isArray(clientData.userRefs)) {
            clientData.userRefs = clientData.userRefs.map((userId: string | number | mongodb.BSON.ObjectId | mongodb.BSON.ObjectIdLike | Uint8Array) => new mongodb.ObjectId(userId));
        }
        
        // Ensure each location has an _id, initializing it if necessary
        // Also, initialize QR codes for zones without one
        if (clientData.location && Array.isArray(clientData.location)) {
            for (const location of clientData.location) {
                if (!location._id) {
                    location._id = new mongodb.ObjectId();
                }
                if (location.zone && Array.isArray(location.zone)) {
                    for (const zone of location.zone) {
                        if (!zone._id) {
                            zone._id = new mongodb.ObjectId();
                        }
                        // Generate QR code if it doesn't exist
                        if (!zone.qrcode) {
                            // Assuming you want to store the zone ID in the QR code
                            zone.qrcode = await QRCode.toDataURL(zone._id.toString());
                        }
                    }
                }
            }
        }

        const query = { _id: new mongodb.ObjectId(id) };
        const update = { $set: clientData };

        const result = await collections.clients.updateOne(query, update);

        if (result && result.matchedCount) {
            console.log(`Successfully updated client with ID ${id}.`);
            res.status(200).send(`Updated client with ID ${id}.`);
        } else if (!result.matchedCount) {
            console.error(`No client found with ID ${id}.`);
            res.status(404).send(`Failed to find a client with ID ${id}.`);
        } else {
            console.error(`Failed to update client with ID ${id}.`);
            res.status(500).send(`Failed to update client with ID ${id}.`);
        }
    } catch (error) {
        console.error("Error while updating client:", error);
        res.status(400).send(error.message);
    }
});


// Delete a client by ID
clientRouter.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const query = { _id: new mongodb.ObjectId(id) };
        const result = await collections.clients.deleteOne(query);
        console.log("Delete result:", result); // Add this logging statement

        if (result && result.deletedCount) {
            res.status(202).send(`Removed client with ID ${id}`);
        } else if (!result.deletedCount) {
            res.status(404).send(`Failed to find a client with ID ${id}`);
        } else {
            res.status(400).send(`Failed to remove client with ID ${id}`);
        }
    } catch (error) {
        console.error("Error while deleting client:", error); // Add this logging statement
        res.status(400).send(error.message);
    }
});

clientRouter.post("/check-in", async (req, res) => {
    const { zoneId, userId } = req.body;
    const now = new Date();

    try {
        // Find the zone and update check-in time
        const zoneQuery = { _id: new mongodb.ObjectId(zoneId) };
        const update = { $set: { "zone.$.lastcheckin": now.toISOString() } };
        await collections.clients.updateOne(zoneQuery, update);

        res.status(200).send("Check-in recorded");
    } catch (error) {
        console.error("Error while recording check-in:", error);
        res.status(500).send(error.message);
    }
});

// New route for check-out
