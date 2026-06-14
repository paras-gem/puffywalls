// MongoDB connection

import mongoose from "mongoose";  

// getting the mongodb url fron .env.local file

const MongoDB_URI = process.env.MONGODB_URI;

// if we forgot to setup .env file
if(!MongoDB_URI){
    throw new Error("Please setup .env file");
}   

// setting up global cache (Fixed: synced variable names to 'cached')
let cached = global.mongoose || {conn: null, promise: null};
if (!global.mongoose) global.mongoose = cached;

// connecting to the database

async function connectDB() {
    // Checking if connection already exists in our global cache
    if(cached.conn)
        return cached.conn;

    // setting up future promise logic

    try {
        // Fire the connection and store the pending promise (future event)
        cached.promise = mongoose.connect(MongoDB_URI);    
        
        // Wait for that promise to resolve successfully
        cached.conn = await cached.promise;
        console.log("Connected to MongoDB successfully");

        return cached.conn; 
    }
    catch(error){ 
        console.log("error in connecting to MongoDB");
        cached.promise = null; // Clear out the failed promise tracking
        throw error;
    }
}

export default connectDB;