import { ConvexProvider } from "convex/react";
import { convex } from "../convex/client";
import { UserBootstrap } from "./UserBootstrap";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <UserBootstrap />
      {children}
    </ConvexProvider>
  );
}
