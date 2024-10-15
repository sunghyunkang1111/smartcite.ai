import KeycloakProvider from "next-auth/providers/keycloak";

const authOptions = {
  // Configure one or more authentication providers
  providers: [
    // !!! Should be stored in .env file.
    KeycloakProvider({
      clientId: `smartcite-client`,
      clientSecret: `3QMUQY74n9ta7fSNRukURPSjZuegp1En`,
      issuer: `http://localhost:8080/realms/smartcite-realm`,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          image: `https://faces-img.xcdn.link/thumb-lorem-face-6312_thumb.jpg`,
        };
      },
    }),
  ],
  secret: `3QMUQY74n9ta7fSNRukURPSjZuegp1En=`,
};

export default authOptions;
