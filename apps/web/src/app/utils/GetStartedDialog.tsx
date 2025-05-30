import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export const GetStartedDialog = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (isOpen: boolean) => void }) => {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-white text-gray-900 hover:bg-gray-100 border-gray-300 hover:text-gray-900 font-bold py-2 px-4 rounded dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-gray-600">
                    Get Started
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md h-fit border-2 border-gray-300 dark:border-white bg-white dark:bg-black">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white cursor-default">Get Started!</DialogTitle>
                    <DialogDescription>
                        <div className="space-y-4">
                            <Input type="text" placeholder="Enter your name" className="w-full h-10 rounded-md dark:bg-gray-100 dark:text-gray-700" />
                            <Input type="text" placeholder="Enter the Room Code (optional)" className="w-full h-10 rounded-md dark:bg-gray-100 dark:text-gray-700 uppercase placeholder:normal-case" />
                            <Button className="w-full h-10 rounded-md bg-black hover:bg-gray-800 text-white dark:bg-gray-900 dark:hover:bg-gray-700" onClick={() => setIsOpen(false)}>
                                Join Room
                            </Button>
                        </div>
                        <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center cursor-default mt-4">
                            Want to create a room? <span className="text-gray-900 dark:text-white font-bold cursor-pointer" onClick={() => setIsOpen(false)}>Create Room</span>
                        </p>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
};
