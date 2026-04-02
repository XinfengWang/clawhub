import { ConvexProvider } from "convex/react";
import { convex } from "../convex/client";
import { LanguageProvider } from "../lib/LanguageContext";
import { UserBootstrap } from "./UserBootstrap";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ConvexProvider client={convex}>
        <UserBootstrap />
        {children}
      </ConvexProvider>
    </LanguageProvider>
  );
}
