import { convex } from "../convex/client";
import { UserBootstrap } from "./UserBootstrap";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UserBootstrap />
      {children}
    </>
  );
}
