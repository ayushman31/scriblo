import jwt from "jsonwebtoken";
import { JWT_USER_PASSWORD } from "@repo/backend-common/config";

export const checkUser = (token: string): string | null => {
    try {
        const decoded = jwt.verify(token, JWT_USER_PASSWORD);

        if (typeof decoded === "string") {
            return null;
        }

        if (!decoded || !decoded.userId) {
            return null;
        }

        return decoded.userId;
    }
    catch (error) {
        console.error("JWT verification error:", error);
        return null;
    }
}