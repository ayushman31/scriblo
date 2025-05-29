import express, { Request, Response } from "express";
import { middleware } from "./middleware";
import bcrypt from "bcrypt";
import { UserSchema } from "@repo/common/types";
import { client } from "@repo/db/client";
import jwt from "jsonwebtoken";
import {JWT_USER_PASSWORD} from "@repo/backend-common/config";

const app = express();
app.use(express.json());

app.post("/signup" , async (req: Request, res: Response) => {
    const parsedData = UserSchema.safeParse(req.body);
    if(!parsedData.success) {
        res.status(400).json({
            message: "Invalid data",
            error: parsedData.error
        });
        return;
    }
    const {username, password} = parsedData.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const foundUser = await client.user.findUnique({
        where: {
            username
        }
    });
    if(foundUser) {
        res.status(400).json({
            message: "User already exists"
        });
        return;
    }
    
    const user = await client.user.create({
        data: {
            username,
            password: hashedPassword
        }
    });
    res.json({
        message: "signed up successfully"
    })
});


app.post("/signin" , async (req: Request, res: Response) => {
    const parsedData = UserSchema.safeParse(req.body);
    if(!parsedData.success) {
        res.status(400).json({
            message: "Invalid data",
            error: parsedData.error
        });
        return;
    };
    const {username, password} = parsedData.data;
    const foundUser = await client.user.findUnique({
        where: {
            username
        }
    });
    if(!foundUser) {
        res.status(400).json({
            message: "User not found"
        });
        return;
    }
    const isPasswordValid = await bcrypt.compare(password, foundUser.password);
    if(!isPasswordValid) {
        res.status(400).json({
            message: "Invalid password"
        });
        return;
    }else{
        const token = jwt.sign({userId: foundUser.id}, JWT_USER_PASSWORD);
        res.json({
            message: "signed in successfully",
            token
        })
    }
});


app.post("/room", middleware, async (req: Request, res: Response) => {
    const { action, roomId } = req.body;

    if (action === "create") {
        const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        try {
            const newRoom = await client.rooms.create({
                data: {
                    roomId: generatedRoomId,
                }
            });

            await client.user.update({
                where: {
                    id: req.userId
                },
                data: {
                    roomId: newRoom.id
                }
            });
            res.json({
                message: "Successfully created and joined room",
                roomId: newRoom.roomId,
                playersCount: 1,
                maxPlayers: newRoom.maxPlayers
            });
        } catch (error) {
            res.status(500).json({
                message: "Error creating room"
            });
        } 
    } else if (action === "join") {
        if (!roomId) {
            res.status(400).json({
                message: "Room ID is required to join"
            });
            return;
        }

        const foundRoom = await client.rooms.findFirst({
            where: {
                roomId: roomId
            },
            include: {
                users: true
            }
        });

        if (!foundRoom) {
            res.status(404).json({
                message: "Room not found"
            });
            return;
        }

        if (foundRoom.users.length >= foundRoom.maxPlayers) {
            res.status(400).json({
                message: "Room is full"
            });
            return;
        }

        // Get user ID from middleware
        const userId = req.userId;

        try {
            await client.user.update({
                where: {
                    id: userId
                },
                data: {
                    roomId: foundRoom.id
                }
            });

            res.json({
                message: "Successfully joined room",
                roomId: foundRoom.roomId,
                playersCount: foundRoom.users.length + 1,
                maxPlayers: foundRoom.maxPlayers
            });
        } catch (error) {
            res.status(500).json({
                message: "Error joining room"
            });
        }
    } else if (action === "random") {
        const rooms = await client.rooms.findMany({
            include: {
              users: true
            }
          });
          
        const foundRoom = rooms.find(room => room.users.length < room.maxPlayers);
          
        if(!foundRoom){
            res.status(404).json({     
                message: "No rooms available"
            });
            return;
        }
        const userId = req.userId;

        try {
            await client.user.update({
                where: {
                    id: userId
                },
                data: {
                    roomId: foundRoom.id
                }
            });

            res.json({
                message: "Successfully joined room",
                roomId: foundRoom.roomId,
                playersCount: foundRoom.users.length + 1,
                maxPlayers: foundRoom.maxPlayers
            });
        } catch (error) {
            res.status(500).json({
                message: "Error joining room"
            });
        }
    } else if (action === "leave") {
        const userId = req.userId;

        try {
            const user = await client.user.findUnique({
                where: {
                    id: userId
                }
            });

            if (!user || !user.roomId) {
                res.status(400).json({
                    message: "User is not in any room"
                });
                return;
            }

            const foundRoom = await client.rooms.findUnique({
                where: {
                    id: user.roomId
                },
                include: {
                    users: true
                }
            });

            await client.user.update({
                where: {
                    id: userId
                },
                data: {
                    roomId: null
                }
            });

            if(foundRoom?.users.length === 1){
                await client.rooms.delete({
                    where: {
                        id: foundRoom.id
                    }
                });
            }

            res.json({
                message: "Successfully left the room"
            });
        } catch (error) {
            res.status(500).json({
                message: "Error leaving room"
            });
        }
    } else {
        res.status(400).json({
            message: "Invalid action. Use 'create', 'join', 'random', or 'leave'"
        });
    }
});


// TODO : Optimize this endpoint for the invitation feature
app.post("/room/:roomId", middleware, async(req: Request, res: Response) => {
    const {roomId} = req.params;
    if (!roomId) {
        res.status(400).json({
            message: "Room ID is required to join"
        });
        return;
    }

    const foundRoom = await client.rooms.findFirst({
        where: {
            roomId: roomId
        },
        include: {
            users: true
        }
    });

    if (!foundRoom) {
        res.status(404).json({
            message: "Room not found"
        });
        return;
    }

    if (foundRoom.users.length >= foundRoom.maxPlayers) {
        res.status(400).json({
            message: "Room is full"
        });
        return;
    }

    // Get user ID from middleware
    const userId = req.userId;

    try {
        await client.user.update({
            where: {
                id: userId
            },
            data: {
                roomId: foundRoom.id
            }
        });

        res.json({
            message: "Successfully joined room",
            roomId: foundRoom.roomId,
            playersCount: foundRoom.users.length + 1,
            maxPlayers: foundRoom.maxPlayers
        });
    } catch (error) {
        res.status(500).json({
            message: "Error joining room"
        });
    }
});

app.listen(3001 , () => {
    console.log("http server listening on PORT 3001");

});