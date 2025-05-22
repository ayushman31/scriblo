import { JWT_USER_PASSWORD } from "@repo/backend-common/config";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
// import { CustomRequest } from "@repo/backend-common/types";

export function middleware(req: Request, res: Response, next: NextFunction){
    const token = req.headers.authorization;
    if(!token) {
        res.status(401).json({
            message: "Unauthorized"
        });
        return;
    }
    const decoded = jwt.verify(token, JWT_USER_PASSWORD) as JwtPayload  ;
    if(!decoded) {
        res.status(401).json({
            message: "Unauthorized"
        });
        return;
    }
    req.userId = decoded.userId;
    next();
}