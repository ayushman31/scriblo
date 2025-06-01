import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/utils/toggle"
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Button>Click me</Button>
      <ModeToggle />
    </div>
  )
}