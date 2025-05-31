"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Fredoka } from 'next/font/google';
import Image from "next/image";
import { useState } from "react";
import { ModeToggle } from "./utils/toggle";
import { GetStartedDialog } from "./utils/GetStartedDialog";


const fredoka = Fredoka({ subsets: ['latin'], weight: '400' });


export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasRoomCode, setHasRoomCode] = useState(true);

  return (
    <div className={`${fredoka.className} bg-grid flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 pb-20 gap-8 sm:gap-16 relative bg-white dark:bg-black`}>
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="text-center z-10">
        <h1 className="text-6xl sm:text-8xl font-bold text-gray-900 dark:text-white">Scriblo</h1>
        <p className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300 mt-4">Unleash your creativity in a game of sketches and smarts!</p>
      </div>

      <div className="z-10">
        <GetStartedDialog isOpen={isOpen} setIsOpen={setIsOpen} hasRoomCode={hasRoomCode} setHasRoomCode={setHasRoomCode} />
      </div>



      {/* images */}
      <div className="absolute top-20 right-4 w-32 h-32 sm:w-[300px] sm:h-[300px] z-10">
        <Image src="/images/image1.png" alt="image" width={300} height={300} className="rounded-full bg-yellow-100 object-cover dark:invert dark:bg-transparent" />
      </div>
      <div className="absolute bottom-4 left-4 w-32 h-32 sm:w-[300px] sm:h-[300px] z-10">
        <Image src="/images/image2.png" alt="image" width={300} height={300} className="rounded-full bg-yellow-100 object-cover dark:invert dark:bg-transparent" />
      </div>
    </div>
  );
}
