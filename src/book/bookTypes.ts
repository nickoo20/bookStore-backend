import { User } from "../user/userTypes";

export interface Book{
    _id : string;
    title:string;
    genre:string;
    author:User;
    coverImage:string;
    file:string;
    createdAt:Date;
    updatedAt:Date;
}