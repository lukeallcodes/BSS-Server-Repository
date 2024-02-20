import * as express from "express";
import * as mongodb from "mongodb";
import { collections } from "./database";
import { Client, Location, Zone } from "./client";
import QRCode from 'qrcode';

export const clientRouter = express.Router();
clientRouter.use(express.json());
if(collections.clients){
// Get all clients
clientRouter.get("/", async (_req, res) => {
    if (!collections.clients) {
        console.error("Database connection not established. `collections.clients` is undefined.");
        return res.status(500).send("Server error: Database connection not established.");
    }

    try {
        const clients = await collections.clients?.find({}).toArray();
        console.log("Get all clients:", clients);
        res.status(200).send(clients);
    } catch (error) {
        console.error("Error while getting all clients:", (error as Error).message);
        res.status(500).send((error as Error).message);
    }
});

// Get a single client by ID
clientRouter.get("/:id", async (req, res) => {
    if (!collections.clients) {
        console.error("Database connection not established. `collections.clients` is undefined.");
        return res.status(500).send("Server error: Database connection not established.");
    }

    try {
        const id = req.params.id;
        const query = { _id: new mongodb.ObjectId(id) };
        const client = await collections.clients?.aggregate([
            { $match: query }
        ]).toArray();

        if (client && client.length > 0) {
            res.status(200).send(client[0]);
        } else {
            res.status(404).send(`Failed to find a client with ID ${id}`);
        }
    } catch (error) {
        console.error("Error while getting client by ID:", (error as Error).message);
        res.status(500).send((error as Error).message);
    }
});

clientRouter.post("/", async (req, res) => {
    if (!collections.clients) {
        console.error("Database connection not established. `collections.clients` is undefined.");
        return res.status(500).send("Server error: Database connection not established.");
    }

    try {
        const { clientname } = req.body;
        const client: Partial<Client> = {
            clientname,
            userRefs: [] 
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
        console.error("Error while creating a new client:", (error as Error).message);
        res.status(400).send((error as Error).message);
    }
});

clientRouter.put("/:id", async (req, res) => {
    if (!collections.clients) {
        console.error("Database connection not established. `collections.clients` is undefined.");
        return res.status(500).send("Server error: Database connection not established.");
    }

    try {
        const id = req.params.id;
        let clientData = req.body;

        delete clientData._id;

        if (clientData.userRefs && Array.isArray(clientData.userRefs)) {
            clientData.userRefs = clientData.userRefs.map((userId: string | number | mongodb.BSON.ObjectId | mongodb.BSON.ObjectIdLike | Uint8Array) => new mongodb.ObjectId(userId));
        }

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
                        if (!zone.qrcode) {
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
        console.error("Error while updating client:", (error as Error).message);
        res.status(400).send((error as Error).message);
    }
});

// Delete a client by ID
clientRouter.delete("/:id", async (req, res) => {
    if (!collections.clients) {
        console.error("Database connection not established. `collections.clients` is undefined.");
        return res.status(500).send("Server error: Database connection not established.");
    }

    try {
        const id = req.params.id;
        const query = { _id: new mongodb.ObjectId(id) };
        const result = await collections.clients.deleteOne(query);
        console.log("Delete result:", result);

        if (result && result.deletedCount) {
            res.status(202).send(`Removed client with ID ${id}`);
        } else if (!result.deletedCount) {
            res.status(404).send(`Failed to find a client with ID ${id}`);
        } else {
            res.status(400).send(`Failed to remove client with ID ${id}`);
        }
    } catch (error) {
        console.error("Error while deleting client:", (error as Error).message);
        res.status(400).send((error as Error).message);
    }
});

clientRouter.post("/check-in", async (req, res) => {
    if (!collections.clients) {
        console.error("Database connection not established. `collections.clients` is undefined.");
        return res.status(500).send("Server error: Database connection not established.");
    }

    try {
        const { zoneId, userId } = req.body;
        const now = new Date();

        const zoneQuery = { _id: new mongodb.ObjectId(zoneId) };
        const update = { $set: { "zone.$.lastcheckin": now.toISOString() } };
        await collections.clients.updateOne(zoneQuery, update);

        res.status(200).send("Check-in recorded");
    } catch (error) {
        console.error("Error while recording check-in:", (error as Error).message);
        res.status(500).send((error as Error).message);
    }
});
}