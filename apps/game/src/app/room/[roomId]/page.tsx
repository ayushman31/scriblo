import { ModeToggle } from "@/utils/toggle";
import { Chat } from "@/components/ui/Chat";
export default async function RoomPage({ params }: { params: { roomId: string } }) {
    const { roomId } = params;
    return (
        <div className="m-10 h-100vh">
            <div className=" bg-gray-800 flex w-full justify-between items-center mb-10">
                <h1 className="text-6xl font-bold">Scriblo</h1>
                <ModeToggle />
            </div>

            <div className=" bg-gray-800 flex w-full justify-between items-center mb-10">
                <div className="w-1/3">
                    <h1 className="text-2xl font-bold">Rounds</h1>
                </div>

                <div className="w-1/3">
                    <h1 className="text-2xl font-bold">Word</h1>
                </div>
            </div>

            <div className="w-full flex items-center justify-center">
                <div className="w-1/5">
                    <Chat />
                </div>

                <div className="w-3/5 bg-red-500">
                    <canvas id="canvas" className="w-full h-full"></canvas>
                </div>

                <div className="w-1/5">
                    <Chat />
                </div>
            </div>
        </div>
    )
}