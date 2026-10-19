// Stub for @lovable.dev/cloud-auth-js: this project uses a name-based session
// (see OnboardingScreen) as the primary auth path. Google connect remains
// optional and gracefully degrades when the cloud-auth package is unavailable.

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (
      _provider: "google" | "apple" | "microsoft",
      _opts?: SignInOptions,
    ): Promise<{ error?: Error; redirected?: boolean }> => {
      return {
        error: new Error(
          "Google sign-in is not configured. Continuing in name-based session mode.",
        ),
      };
    },
  },
};
