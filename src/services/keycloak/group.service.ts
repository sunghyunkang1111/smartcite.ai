import axios from "axios";
import { getHeaderFromToken } from "./user.service";

const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
const realmId = process.env.NEXT_PUBLIC_KEYCLOAK_REALM_ID;

export const getAllGroups = async (token: string) => {
  try {
    const getOrg = await axios.get(
      `${keycloakUrl}/admin/realms/${realmId}/groups`,
      getHeaderFromToken(token)
    );
    return getOrg.data;
  } catch (error) {
    console.error("Error found:", error);
    throw error;
  }
};
