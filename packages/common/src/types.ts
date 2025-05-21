import {z } from "zod";

export const UserSchema  = z.object({
    username : z.string().min(3, "Username must be minimum 3 characters long.").max(20, "Username cannot exceed 20 characters."),
    password: z.string().min(6, "Password must be minimum 6 charactes long.")
});

