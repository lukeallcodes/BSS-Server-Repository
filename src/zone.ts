import * as mongodb from "mongodb";
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