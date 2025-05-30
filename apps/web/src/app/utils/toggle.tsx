import { Sun } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function ModeToggle() {
    const { theme, setTheme } = useTheme();
  
    const toggleTheme = () => {
      setTheme(theme === "dark" ? "light" : "dark");
    };
  
    return (
      <Toggle
        aria-label="Toggle theme"
        onPressedChange={toggleTheme}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </Toggle>
    );
  }