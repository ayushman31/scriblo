import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useRef } from "react";
export const GetStartedDialog = ({ isOpen, setIsOpen, hasRoomCode, setHasRoomCode }: { isOpen: boolean, setIsOpen: (isOpen: boolean) => void, hasRoomCode: boolean, setHasRoomCode: (hasRoomCode: boolean) => void }) => {
    const router = useRouter();
    const ref = useRef<HTMLInputElement>(null);
    return (
        hasRoomCode ? (<Dialog open={isOpen} onOpenChange={setIsOpen} >
            <DialogTrigger asChild>
                <Button variant="outline" size="lg" >
                    Get Started
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md h-fit border-2 border-gray-300 dark:border-white bg-white dark:bg-black">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white cursor-default">Get Started!</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <Input type="text" placeholder="Enter your name" className="w-full h-10 rounded-md dark:bg-gray-100 dark:text-gray-700" />
                    <Input type="text" placeholder="Enter the Room Code (optional)" className="w-full h-10 rounded-md dark:bg-gray-100 dark:text-gray-700 uppercase placeholder:normal-case" ref={ref} />
                    <Button variant={"outline"} className="w-full" onClick={() => { setIsOpen(false); window.location.href = `http://localhost:3001/room/${ref.current?.value}`; }}>
                        Join Room
                    </Button>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 text-center cursor-default mt-4">
                    Want to create a room? <span className="text-gray-900 dark:text-white font-bold cursor-pointer" onClick={() => {setHasRoomCode(false); }}>Create Room</span>
                </p>
            </DialogContent>

        </Dialog>
    ) : (<Dialog open={isOpen} onOpenChange={setIsOpen} >
        <DialogTrigger asChild>
            <Button variant="outline" size="lg" >
                Get Started
            </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md h-fit border-2 border-gray-300 dark:border-white bg-white dark:bg-black">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white cursor-default">Get Started!</DialogTitle>
            </DialogHeader>

            <form className="space-y-4 mt-4">
                <Input type="text" placeholder="Enter your name" required className="w-full h-10 rounded-md dark:bg-gray-100 dark:text-gray-700" />
                <Button variant={"outline"} className="w-full" onClick={
                    () => {
                        setIsOpen(false);
                        const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
                        window.location.href = `http://localhost:3001/room/${generatedRoomId}`;
                    }
                }>
                    Create Room
                </Button>
            </form>

            <p className="text-sm text-gray-500 dark:text-gray-400 text-center cursor-default mt-4">
                Want to join a room? <span className="text-gray-900 dark:text-white font-bold cursor-pointer" onClick={() => {setHasRoomCode(true); }}>Join Room</span>
            </p>
        </DialogContent>

    </Dialog>
    ));
};
