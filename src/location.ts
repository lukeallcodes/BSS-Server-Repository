import * as mongodb from "mongodb";
import { Zone } from "./zone";

export interface Location{

    locationname: string;
    assignedusers: mongodb.ObjectId[];
    zone: Zone[];
    _id: mongodb.ObjectId;

}