import { auth } from "@/lib/firebase"; // Your fixed auth instance
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export const handleGoogleSignIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // Quick runtime guard check
    console.log("Checking if Client ID env variable is loaded:", !!clientId);

    if (!clientId) {
      throw new Error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable!");
    }

    // Attach the env variable correctly
    provider.setCustomParameters({
      client_id: clientId
    });

    // Run handshake (auth first, provider second)
    const result = await signInWithPopup(auth, provider);
    return result.user;

  } catch (error) {
    console.error("Google Sign-In Error Code:", error.code);
    console.error("Google Sign-In Error Message:", error.message);
    throw error;
  }
};