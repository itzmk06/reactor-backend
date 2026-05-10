import { AppError } from "../../lib/error";
import {Request,Response,NextFunction} from "express"

export function errorMiddleware(err:any,req:Request,res:Response,next:NextFunction){
    const statusCode=err instanceof AppError?err.statusCode:500
    res.status(statusCode).json({
        success:false, 
        message:err.message||"Internal Server Error"
    })
}