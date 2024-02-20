import * as mongodb from "mongodb";

export interface Client {
    clientname: string;
    location: Location[];
    userRefs: mongodb.ObjectId[]; // Array of references to User objects
    _id?: mongodb.ObjectId;
}

export interface Location{

    locationname: string;
    assignedusers: mongodb.ObjectId[];
    zone: Zone[];
    _id: mongodb.ObjectId;

}

export interface Zone{

    zonename: string;
    steps: string[];
    qrcode: string;
    lastcheckin: string;
    lastcheckout: string;
    timespent: string;
    assignedusers: mongodb.ObjectId[];
    _id: mongodb.ObjectId;

}
