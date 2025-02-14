"use client";
import { LoadingOverlay } from "@mantine/core";
import { useEffect, useState } from "react";
import { CompleteProfile } from "@/components/auth/signup/CompleteProfile";
import { useSearchParams } from "next/navigation";
import { RoleOptiosn } from "@/utils/util.constants";
import { CompleteTeamProfile } from "@/components/auth/signup/CompleteTeamProfile";
import { GeneralSignupLayout } from "@/components/auth/signup/GeneralSignupLayout";
import {
  getSuperAdminToken,
  verifyEmail,
} from "@/services/keycloak/user.service";
import { jwtDecode } from "jwt-decode";

export default function Page() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenData, setTokenData] = useState<any>();
  useEffect(() => {
    const key = searchParams.get("key");

    const validateAndVerifyEmail = async (key: string) => {
      try {
        const token = await validateInviteToken(key);
        setTokenData(token);
        const adminToken = await getSuperAdminToken();
        await verifyEmail(token.sub, adminToken.access_token);
        setIsLoading(false);
      } catch (error) {
        console.log(error);
        setIsLoading(false);
      }
    };
    if (key) {
      validateAndVerifyEmail(key);
    }
  }, [searchParams]);

  const validateInviteToken = async (token: string): Promise<any> => {
    try {
      const decodedToken = jwtDecode<any>(token);
      if (!decodedToken.eml || !decodedToken.exp || !decodedToken.sub) {
        return Promise.reject(
          new Error("Invalid token: Missing required fields")
        );
      }
      const currentTime = Date.now() / 1000;
      if (decodedToken?.exp && decodedToken?.exp < currentTime) {
        return Promise.reject(new Error("Token has expired"));
      }
      return Promise.resolve(decodedToken);
    } catch (error) {
      console.log(error);
      return Promise.reject(new Error("Token validation failed"));
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#fafafa]">
      <GeneralSignupLayout title="Complete Your Profile" step={3}>
        <div className="relative">
          <LoadingOverlay
            visible={isLoading}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
            loaderProps={{ color: "pink", type: "bars" }}
          />
          {role === RoleOptiosn.INDIVIDUAL ? (
            <CompleteProfile userId={tokenData?.sub} />
          ) : (
            <CompleteTeamProfile userId={tokenData?.sub} />
          )}
        </div>
      </GeneralSignupLayout>
    </div>
  );
}
