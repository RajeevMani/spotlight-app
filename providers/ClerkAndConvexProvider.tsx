import { ReactNode } from "react";
import { tokenCache } from "@/cache";
import {
  ClerkProvider,
  ClerkLoaded,
  useAuth,
} from "@clerk/clerk-expo";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL!
);

type Props = {
  children: ReactNode;
};

export default function ClerkAndConvexProvider({ children }: Props) {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk
        client={convex}
        useAuth={(useAuth as any)} // 👈 fix TypeScript error
      >
        <ClerkLoaded>{children}</ClerkLoaded>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}                     