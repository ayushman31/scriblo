import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorDialog } from "@/components/ui/ErrorDialog";
import { getRoomInfo } from "@/lib/api";
import { useRef, useState } from "react";

export const GetStartedDialog = ({ isOpen, setIsOpen, hasRoomCode, setHasRoomCode }: { isOpen: boolean, setIsOpen: (isOpen: boolean) => void, hasRoomCode: boolean, setHasRoomCode: (hasRoomCode: boolean) => void }) => {
    const roomRef = useRef<HTMLInputElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorTitle, setErrorTitle] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (roomId?: string) => {
        const username = usernameRef.current?.value.trim();
        if (!username) {
            console.error("Username is required");
            return;
        }

        if (!roomId) {
            const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            window.location.href = `http://game.ayushman.blog/room/${roomId}?username=${encodeURIComponent(username)}`;
            return;
        }

        // roomid validation
        setIsLoading(true);
        try {
            const roomInfo = await getRoomInfo(roomId);
            
            if (roomInfo.exists) {
                // Room exists, proceed to join
                // Note: Room capacity is managed by the WebSocket server during actual join
                window.location.href = `http://game.ayushman.blog/room/${roomId}?username=${encodeURIComponent(username)}`;
            } else {
                // Room doesn't exist, show error dialog
                setErrorTitle("Oops! Room Not Found");
                setErrorMessage(`The room with code "${roomId.toUpperCase()}" does not exist.`);
                setShowErrorDialog(true);
            }
        } catch (error) {
            console.error("Error validating room:", error);
            setErrorTitle("Connection Error");
            setErrorMessage("Unable to validate room. Please check your connection and try again.");
            setShowErrorDialog(true);
        } finally {
            setIsLoading(false);
        }
    }

    const handleCreateRoom = () => {
        setHasRoomCode(false);
        setShowErrorDialog(false);
    };
    return (
        <>
            {hasRoomCode ? (
                <Dialog open={isOpen} onOpenChange={setIsOpen} >
                    <DialogTrigger asChild>
                        <Button variant="outline" size="lg" >
                            Get Started
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md h-fit border-2 border-gray-300 dark:border-white bg-white dark:bg-black">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white cursor-default">Get Started!</DialogTitle>
                        </DialogHeader>

                        <form className="space-y-4 mt-4" onSubmit={async (e) => { 
                            e.preventDefault(); 
                            const roomId = roomRef.current?.value.trim(); 
                            await handleSubmit(roomId);
                        }}>
                            <Input type="text" placeholder="Enter your name" className="w-full h-10 rounded-md dark:bg-gray-100 dark:text-gray-700" ref={usernameRef} required />
                            <Input type="text" placeholder="Enter the Room Code (optional)" className="w-full h-10 rounded-md dark:bg-gray-100 dark:text-gray-700 uppercase placeholder:normal-case" ref={roomRef} />
                            <Button variant={"outline"} className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? "Validating..." : "Join Room"}
                            </Button>
                        </form>

                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center cursor-default mt-4">
                            Want to create a room? <span className="text-gray-900 dark:text-white font-bold cursor-pointer" onClick={() => { setHasRoomCode(false); }}>Create Room</span>
                        </p>
                    </DialogContent>
                </Dialog>
            ) : (
                <Dialog open={isOpen} onOpenChange={setIsOpen} >
                    <DialogTrigger asChild>
                        <Button variant="outline" size="lg" >
                            Get Started
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md h-fit border-2 border-gray-300 dark:border-white bg-white dark:bg-black">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white cursor-default">Get Started!</DialogTitle>
                        </DialogHeader>

                        <form className="space-y-4 mt-4" onSubmit={async (e) => { 
                            e.preventDefault(); 
                            setIsOpen(false); 
                            await handleSubmit(); // No roomId for create room
                        }}>
                            <Input type="text" placeholder="Enter your name" required className="w-full h-10 rounded-md dark:bg-gray-100 dark:text-gray-700" ref={usernameRef} />
                            <Button variant={"outline"} className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? "Creating..." : "Create Room"}
                            </Button>
                        </form>

                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center cursor-default mt-4">
                            Want to join a room? <span className="text-gray-900 dark:text-white font-bold cursor-pointer" onClick={() => { setHasRoomCode(true); }}>Join Room</span>
                        </p>
                    </DialogContent>
                </Dialog>
            )}

            <ErrorDialog
                isOpen={showErrorDialog}
                onClose={() => setShowErrorDialog(false)}
                title={errorTitle}
                message={errorMessage}
                actionText="Create Room"
                onAction={handleCreateRoom}
            />
        </>
    );
};
