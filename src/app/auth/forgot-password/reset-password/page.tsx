"use client";
import { Button, LoadingOverlay, PasswordInput } from "@mantine/core";
import { useNavigation } from "@refinedev/core";
import { FormEvent, useEffect, useState } from "react";
import { IconArrowLeft } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import {
  getSuperAdminToken,
  resetPassword,
} from "@/services/keycloak/user.service";
import { jwtDecode } from "jwt-decode";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { notification } from "antd";

export default function Page() {
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const form = useForm({
    initialValues: {
      password: "",
      password2: "",
    },

    validate: {
      password2: (val, values) =>
        val !== values.password ? "Passwords don't match" : null,
    },
  });

  useEffect(() => {
    const token = searchParams.get("key");
    if (token) {
      validateInviteToken(token);
    }
  });
  const validateInviteToken = async (token: string): Promise<any> => {
    try {
      const decodedToken = jwtDecode<any>(token);
      if (!decodedToken.eml || !decodedToken.exp) {
        return Promise.reject(
          new Error("Invalid token: Missing required fields")
        );
      }
      if (decodedToken.rqac[0] != "UPDATE_PASSWORD") {
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
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.validate().hasErrors) {
      return;
    }

    try {
      setIsLoading(true);
      const adminToken = await getSuperAdminToken();
      if (!adminToken) throw new Error("Failed to retrieve admin token.");
      const reset = await resetPassword(
        userId as string,
        form.values.password,
        adminToken.access_token
      );
      if (!reset) throw new Error("Failed to reset password.");
      setIsLoading(false);
      push("/auth/forgot-password/success");
    } catch (error) {
      setIsLoading(false);
      notification.error({
        message: "Error",
        description: "Failed to reset password. Please try again later.",
      });
      console.log(error);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#fafafa]">
      <div className="h-screen w-full flex items-center justify-center bg-[#fafafa]">
        <div className="w-[500px] flex flex-col p-6 bg-white rounded-lg shadow-lg relative">
          <LoadingOverlay
            visible={isLoading}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
            loaderProps={{ color: "pink", type: "bars" }}
          />
          <Link
            href="/auth/login"
            className="w-10 h-10 border rounded-lg flex items-center justify-center border-black cursor-pointer"
          >
            <IconArrowLeft size={24} color="black" stroke={2} />
          </Link>
          <div className="text-2xl font-bold pt-4 pb-2.5 text-black">
            Reset Password
          </div>
          <div className="text-[#989898]">
            Set a new password to secure your account
          </div>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <PasswordInput
              required
              label="Password"
              placeholder="Enter your password"
              value={form.values.password}
              onChange={(event) =>
                form.setFieldValue("password", event.currentTarget.value)
              }
              error={form.errors.password}
              radius="sm"
              labelProps={{ style: { color: "black", marginBottom: "6px" } }}
            />
            <PasswordInput
              required
              label="Confirm Password"
              placeholder="Re-enter password"
              value={form.values.password2}
              onChange={(event) =>
                form.setFieldValue("password2", event.currentTarget.value)
              }
              error={form.errors.password2}
              radius="sm"
              labelProps={{ style: { color: "black", marginBottom: "6px" } }}
            />
            <Button
              variant="filled"
              color="dark.6"
              radius="md"
              size="md"
              fullWidth
              style={{ fontSize: "14px" }}
              type="submit"
            >
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
