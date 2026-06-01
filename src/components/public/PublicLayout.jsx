import { Outlet } from "react-router-dom";
import { PublicNavbar } from "./PublicNavbar";
import { PublicFooter } from "./PublicFooter";
import { FloatingChatWidget } from "../chat/FloatingChatWidget";

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 flex flex-col">
      <PublicNavbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      <PublicFooter />
      <FloatingChatWidget />
    </div>
  );
};