import dotenv from "dotenv";
import connectDB from "./db/database.js";
import {app} from "./app.js"

dotenv.config();

connectDB()
.then(()=>{

    //   for error 
    app.on("error", (error)=>{
        console.log()
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`App is litening on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGO DB connection failed", err);
})