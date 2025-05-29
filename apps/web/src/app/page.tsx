"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Inter } from 'next/font/google';
import Link from "next/link";
import { useState } from "react";

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return (
    <div className={`${inter.className} flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20`}>
      <h1 className="text-8xl font-bold font-serif">Scriblo</h1>
      <p className="text-2xl font-bold">A game of sketches and smarts.</p>
      {isLoggedIn ? (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Get Started</Button>
        </DialogTrigger>
        <DialogContent className="max-w-md h-fit">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Enter your login details</DialogTitle>
            <DialogDescription>
              <Input type="email" placeholder="Email" className="w-full mt-4 h-10 rounded-md" />
              <Input type="password" placeholder="Password" className="w-full mt-4 h-10 rounded-md" />
              <Button className="w-full mt-4 h-10 rounded-md" onClick={() => setIsOpen(false)}>Login</Button>
              <p className="text-sm text-muted-foreground mt-4 text-center">Don't have an account? Sign up</p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
        </Dialog>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Get Started</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md h-fit">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Enter your login details</DialogTitle>
              <DialogDescription>
                <Input type="email" placeholder="Email" className="w-full mt-4 h-10 rounded-md" />
                <Input type="password" placeholder="Password" className="w-full mt-4 h-10 rounded-md" />
                <Button className="w-full mt-4 h-10 rounded-md" onClick={() => setIsOpen(false)}>Login</Button>
                <p className="text-sm text-muted-foreground mt-4 text-center">Already have an account? Login</p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
          </Dialog>
        ) }
    </div>
    );
  }