"use client";
import { type AuthProvider } from "@refinedev/core";
import {
  addUserToOrganization,
  getSuperAdminToken,
  getUserGroup,
} from "@/services/keycloak/user.service";
import { Group, RoleOptiosn } from "@/utils/util.constants";
import axios from "axios";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";
import { notification } from "antd";
const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
const realmId = process.env.NEXT_PUBLIC_KEYCLOAK_REALM_ID;
const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
const clientSecret = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET;

const getCurrentUser = () => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    const user = jwt.decode(accessToken as string) as any;
    const keycloakClicnetId = clientId as string;
    const roles = user?.resource_access?.[keycloakClicnetId]?.roles;
    return { ...user, roles: roles || [] };
  }
  return null;
};

export const authProvider: AuthProvider = {
  login: async ({ email, password, organizationId }) => {
    const response = await axios.post(
      `${keycloakUrl}/realms/${realmId}/protocol/openid-connect/token`,
      {
        grant_type: "password",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "email openid",
        username: email,
        password: password,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const userId = jwt.decode(response.data.access_token)?.sub as string;
    if (organizationId) {
      await addUserToOrganization(
        userId,
        organizationId,
        response.data.access_token
      );
    }

    if (response.status === 200) {
      localStorage.setItem("accessToken", response.data.access_token);
      localStorage.setItem("refreshToken", response.data.refresh_token);
      notification.success({
        message: "Success",
        description: "Logged in successfully.",
      });
      return {
        success: true,
        redirectTo: "/cases",
      };
    } else {
      return {
        success: false,
      };
    }
  },
  logout: async () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    notification.success({
      message: "Success",
      description: "Logged out successfully.",
    });
    return {
      success: true,
      redirectTo: "/auth/login",
    };
  },
  onError: async (error) => {
    if (error.response?.status === 401) {
      return {
        logout: true,
      };
    }

    return {
      error,
    };
  },
  check: async () => {
    const queryParams = new URLSearchParams(window.location.search);
    const pathName = window.location.pathname;
    if (pathName.includes("registrations") && queryParams.get("token")) {
      const key = queryParams.get("token") as string;
      const decodedTokenData = jwtDecode<any>(key);
      localStorage.setItem("signupRole", RoleOptiosn.INDIVIDUAL);
      return {
        authenticated: false,
        redirectTo: `/auth/signup/setup-account?organizationId=${decodedTokenData.org_id}&key=${key}`,
      };
    }
    if (
      queryParams.get("key") &&
      pathName.includes("login-actions/action-token")
    ) {
      const key = queryParams.get("key") as string;
      const decodedTokenData = jwtDecode<any>(key);
      const tokenType = decodedTokenData.typ;
      const userId = decodedTokenData.sub;
      if (tokenType == "verify-email") {
        const token = await getSuperAdminToken();
        const userGroups = await getUserGroup(userId, token.access_token);
        const role = userGroups.find((group: any) => group.name == Group.ADMIN)
          ? RoleOptiosn.ORGANIZATION
          : RoleOptiosn.INDIVIDUAL;
        return {
          authenticated: false,
          redirectTo: `/auth/signup/complete-profile?role=${role}&key=${key}`,
        };
      } else if (tokenType == "ORGIVT") {
        localStorage.setItem("signupRole", RoleOptiosn.INDIVIDUAL);
        return {
          authenticated: false,
          redirectTo: `/auth/organization-join?organizationId=${decodedTokenData.org_id}&key=${key}`,
        };
      } else if (tokenType == "execute-actions") {
        return {
          authenticated: false,
          redirectTo: `/auth/forgot-password/reset-password?userId=${decodedTokenData.sub}&key=${key}`,
        };
      }
    }
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      const response = await axios.post(
        `${keycloakUrl}/realms/${realmId}/protocol/openid-connect/token`,
        {
          grant_type: "refresh_token",
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken || " ",
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      if (response.status === 200) {
        localStorage.setItem("accessToken", response.data.access_token);
        localStorage.setItem("refreshToken", response.data.refresh_token);
        return {
          authenticated: true,
        };
      }
      throw new Error("Failed to refresh token");
    } catch (err) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tempToken");
      return {
        authenticated: false,
        redirectTo: "/auth/login",
      };
    }
  },
  getPermissions: async () => {
    return null;
  },
  getIdentity: async () => {
    return getCurrentUser();
  },
};
