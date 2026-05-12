"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"night" | "day">("night");

  useEffect(() => {
    // Read what the inline script already applied (no flash)
    const current = document.documentElement.getAttribute("data-theme") as "night" | "day";
    setTheme(current || "night");
  }, []);

  const toggle = () => {
    const next = theme === "night" ? "day" : "night";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("wildmap-theme", next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle day/night theme"
      className="hover:opacity-70 transition-opacity"
      style={{ color: "var(--fg-2)", padding: "4px", display: "flex", alignItems: "center" }}
    >
      {theme === "night"
        ? <Sun className="w-4 h-4" />
        : <Moon className="w-4 h-4" />}
    </button>
  );
}
