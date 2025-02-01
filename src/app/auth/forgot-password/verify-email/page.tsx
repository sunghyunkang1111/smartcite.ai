"use client";
import { Button, LoadingOverlay } from "@mantine/core";
import { useSearchParams } from "next/navigation";
import { IconMessage, IconSend } from "@tabler/icons-react";
import {
  getSuperAdminToken,
  sendResetPasswordEmail,
} from "@/services/keycloak/user.service";
import { useState } from "react";
import { notification } from "antd";

export default function AuthenticationForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const userid = searchParams.get("userid") as string;
  const resendEmail = async () => {
    try {
      setIsLoading(true);
      const adminToken = await getSuperAdminToken();
      const sendEmail = await sendResetPasswordEmail(
        userid,
        adminToken.access_token
      );
      if (!sendEmail) throw new Error("Error found");
      notification.success({
        message: "Success",
        description: "Successfully sent a reset password email",
      });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log("Error found", error);
      notification.error({
        message: "Error",
        description:
          "Failed to send a reset password email. Please try again later.",
      });
      return "Error found";
    }
  };
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#fafafa] relative">
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
        loaderProps={{ color: "pink", type: "bars" }}
      />
      <div className="w-[480px] shadow-lg py-10 flex flex-col p-8 bg-white rounded-lg justify-center items-center">
        <div className="bg-[#4bae4f] rounded-full w-14 h-14 flex items-center justify-center">
          <IconMessage color="white" size={32} stroke={2} />
        </div>
        <div className="py-4 flex justify-center items-center flex-col">
          <span className="font-bold">Password reset email sent</span> We’ve
          sent a password reset email. Please check your inbox (and spam/junk
          folder) and click the link to reset your password
        </div>
        <Button
          variant="default"
          leftSection={<IconSend size={14} />}
          onClick={resendEmail}
        >
          Resend Email
        </Button>
      </div>
    </div>
  );
}
