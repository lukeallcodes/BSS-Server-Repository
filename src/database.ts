import * as mongodb from "mongodb";
import { Client } from "./client";
import { Location } from "./location";
import { Zone } from "./zone";
import { NewUser } from "./newuser";

export const collections: {
    clients?: mongodb.Collection<Client>;
    users?: mongodb.Collection<NewUser>;
} = {};

export async function connectToDatabase(uri: string) {
    const client = new mongodb.MongoClient(uri);
    await client.connect();

    const db = client.db("test");
    await applySchemaValidation(db);

    const clientsCollection = db.collection<Client>("clients");
    collections.clients = clientsCollection;

    const usersCollection = db.collection<NewUser>("users");
    collections.users = usersCollection;
}

async function applySchemaValidation(db: mongodb.Db) {
    // Clients Schema Validation
    const clientSchema = {
        $jsonSchema: {
            bsonType: "object",
            required: ["clientname", "location", "userRefs"],
            additionalProperties: false,
            properties: {
                _id: {},
                clientname: {
                    bsonType: "string",
                },
                location: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["locationname", "assignedusers", "zone"],
                        additionalProperties: false,
                        properties: {
                            _id: {},
                            locationname: {
                                bsonType: "string",
                            },
                            assignedusers: {
                                bsonType: "array",
                                items: {
                                    bsonType: "objectId",
                                },
                            },
                            zone: {
                                bsonType: "array",
                                items: {
                                    bsonType: "object",
                                    required: ["zonename", "steps", "assignedusers"],
                                    additionalProperties: false,
                                    properties: {
                                        _id: {},
                                        zonename: {
                                            bsonType: "string",
                                        },
                                        steps: {
                                            bsonType: "array",
                                            items: {
                                                bsonType: "string",
                                            },
                                        },
                                        assignedusers: {
                                            bsonType: "array",
                                            items: {
                                                bsonType: "objectId",
                                            },
                                        },
                                        qrcode: {
                                            bsonType: "string",
                                        },
                                        lastcheckin: {

                                            bsonType: "string",

                                        },
                                        lastcheckout: {

                                            bsonType: "string",

                                        },
                                        timespent: {

                                            bsonType: "string",

                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                userRefs: {
                    bsonType: "array",
                    items: {
                        bsonType: "objectId",
                    },
                },
            },
        },
    };

    // Users Schema Validation
    const userSchema = {
        $jsonSchema: {
            bsonType: "object",
            required: ["firstname", "lastname", "role", "email", "passwordHash", "assignedlocations", "clientid", "assignedzones"],
            additionalProperties: false,
            properties: {
                _id: {},
                firstname: {
                    bsonType: "string",
                },
                lastname: {
                    bsonType: "string",
                },
                role: {
                    bsonType: "string",
                },
                email: {
                    bsonType: "string",
                },
                passwordHash: {
                    bsonType: "string",
                },
                assignedlocations: {
                    bsonType: "array",
                    items: {
                        bsonType: "objectId",
                    },
                },
                clientid: {
                    bsonType: "objectId",
                },
                assignedzones: {
                    bsonType: "array",
                    items: {
                        bsonType: "objectId",
                    },
                },
            },
        },
    };

    await db.command({
        collMod: "clients",
        validator: clientSchema,
    }).catch(async (error) => {
        if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("clients", { validator: clientSchema });
        }
    });

    await db.command({
        collMod: "users",
        validator: userSchema,
    }).catch(async (error) => {
        if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("users", { validator: userSchema });
        }
    });
}
