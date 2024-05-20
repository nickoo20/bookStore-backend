import express, { NextFunction, Request, Response } from "express" ;
import globalErrorHandler from "./middlewares/globalErrorHandler" ;
import userRouter from "./user/userRouter" ;
import cookieParser from 'cookie-parser';  
import bookRouter from "./book/bookRouter";

const app = express() ;

// app.use("/") ;
app.use(express.json()) ;
app.use(cookieParser()) ;
app.use('/api/users',userRouter) ;
app.use('/api/books', bookRouter) ;

// Global error handler ;

app.use(globalErrorHandler) ;

export default app ;
