import { config } from "./config";
import mongoose from "mongoose";

const connectDB = async()=>{
    try{
        mongoose.connection.on('connected',()=>{
            console.log("Connected successfully to the database!") ;
        });
        mongoose.connection.on('error',(err) => {
            console.log('Error connecting to database! ', err) ;
        })
        await mongoose.connect(config.databaseUrl as string) ;
    }catch(err){    
        console.log(err) ;
        process.exit(1) ;
    }
}

export default connectDB; 