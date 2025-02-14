"use client";
import { Button, LoadingOverlay, TextInput } from "@mantine/core";
import { useNavigation } from "@refinedev/core";
import { FormEvent, useState } from "react";
import { IconArrowLeft } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import {
  getSuperAdminToken,
  getUserByEmail,
  sendResetPasswordEmail,
} from "@/services/keycloak/user.service";
import Link from "next/link";
import { notification } from "antd";

export default function Page() {
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    initialValues: {
      email: "",
    },

    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : "Invalid email"),
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.validate().hasErrors) {
      return;
    }

    try {
      setIsLoading(true);
      const adminToken = await getSuperAdminToken();
      if (!adminToken) throw new Error("Failed to retrieve admin token.");
      const user = await getUserByEmail(form.values.email, adminToken.access_token);
      if (!user) throw new Error("Failed to get user by email.");
      const sendResetPassword = await sendResetPasswordEmail(user.id, adminToken.access_token);
      if (!sendResetPassword) throw new Error("Failed to send reset password.");
      setIsLoading(false);
      notification.success({
        message: "Success",
        description: "Successfully sent a reset password email",
      });
      push(`/auth/forgot-password/verify-email?userid=${user.id}`);
    } catch (error) {
      setIsLoading(false);
      notification.error({
        message: "Error",
        description: "Failed to send a verify email. Please try again later.",
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
            Forgot Password
          </div>
          <div className="text-[#989898]">
            Enter your email to reset your password
          </div>
          <form onSubmit={handleSubmit} className="mt-5">
            <TextInput
              required
              label="Email"
              placeholder="hello@mantine.dev"
              value={form.values.email}
              onChange={(event) =>
                form.setFieldValue("email", event.currentTarget.value)
              }
              error={form.errors.email && "Invalid email"}
              radius="sm"
              labelProps={{ style: { color: "black", marginBottom: "6px" } }}
            />
            <Button
              variant="filled"
              color="dark.6"
              radius="md"
              size="md"
              fullWidth
              mt={"md"}
              style={{ fontSize: "14px" }}
              type="submit"
            >
              Continue
            </Button>
          </form>
          <div className="text-center mt-5 text-[#989898]">
            Already have an acount?
            <span className="text-black font-bold underline ml-2">Sign In</span>
          </div>
        </div>
      </div>
    </div>
  );
}
