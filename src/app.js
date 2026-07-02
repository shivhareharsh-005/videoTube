
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded())
app.use(express.static("public"))
app.use(cookieParser())


//  import routes 
import userRouter from "./routes/user.routes.js"

// routes declaraiton
app.use("/users", userRouter);



// http://localhost:port/users/register
export { app }