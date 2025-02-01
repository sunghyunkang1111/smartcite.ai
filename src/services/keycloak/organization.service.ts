import axios from "axios";
import { getHeaderFromToken } from "./user.service";

const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
const realmId = process.env.NEXT_PUBLIC_KEYCLOAK_REALM_ID;

export const getOrganizationById = async (orgId: string, token: string) => {
  try {
    const getOrg = await axios.get(
      `${keycloakUrl}/admin/realms/${realmId}/organizations/${orgId}`,
      getHeaderFromToken(token)
    );
    return getOrg.data;
  } catch (error) {
    console.error("Error found:", error);
    throw error;
  }
};

export const leaveOrganization = async (orgId: string, userId: string, token: string) => {
  try {
    const leaveOrg = await axios.delete(
      `${keycloakUrl}/admin/realms/${realmId}/organizations/${orgId}/members/${userId}`,
      getHeaderFromToken(token)
    );
    console.log("leaveOrg", leaveOrg);
    return "Success";
  } catch (error) {
    console.error("Error found:", error);
    throw error;
  }
};
