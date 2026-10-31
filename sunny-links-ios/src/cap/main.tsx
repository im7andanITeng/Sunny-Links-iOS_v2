import { createRoot } from "react-dom/client";
import GolfApp from "@/components/golf/GolfApp";
import "@/styles.css";

/**
 * Native-app entry point. The game never talks to a server of its own (profiles
 * and the leaderboard go straight to the backend over HTTPS), so the phone
 * build is a plain static bundle with no SSR server behind it.
 */
createRoot(document.getElementById("root")!).render(<GolfApp />);
