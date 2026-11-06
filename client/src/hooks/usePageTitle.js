import { useEffect } from "react";

// Gives each page its own browser-tab title, e.g. "Grades · Course Portal".
// Screen readers announce it, and it helps when several tabs are open (WCAG 2.4.2).
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Course Portal` : "Course Portal";
  }, [title]);
}
