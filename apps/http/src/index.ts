import express, { Request, Response } from "express";
import { middleware } from "./middleware";
import bcrypt from "bcrypt";


const app = express();
app.use(express.json());

app.post("/signup" , (req: Request, res: Response) => {
    //dbcall
    res.json({
        message: "signed up successfully"
    })
});


app.post("/signin" , (req: Request, res: Response) => {
    //dbcall
    res.json({
        message: "signed in successfully"
    })
});


app.post("/room" ,middleware , (req: Request, res: Response) => {
    //dbcall
    res.json({
        message: "room created"
    })
})


app.post("/room/:slug" , (req: Request, res: Response) => {
    //dbcall
    res.json({
        message: "room"
    })
});


// app.post("/room/:roomId" , (req: Request, res: Response) => {

// });

app.listen(3000 , () => {
    console.log("http server listening on PORT 3000");
    
});