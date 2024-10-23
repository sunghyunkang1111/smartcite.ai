import KeycloakProvider from "next-auth/providers/keycloak";
const clientId = process.env.CLIENT_ID as string;
const clientSecret = process.env.CLIENT_SECRET as string;
const issuer = process.env.ISSUER;

const authOptions = {
  // Configure one or more authentication providers
  providers: [
    // !!! Should be stored in .env file.
    KeycloakProvider({
      clientId: clientId,
      clientSecret: clientSecret,
      issuer: issuer,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
        };
      },
    }),
  ],
  secret: `3QMUQY74n9ta7fSNRukURPSjZuegp1En`,
};

export default authOptions;
