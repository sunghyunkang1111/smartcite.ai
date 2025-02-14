"use client";

import { Button, LoadingOverlay, TextInput } from "@mantine/core";
import { useNavigation } from "@refinedev/core";
import { FormEvent, useState } from "react";
import { useForm } from "@mantine/form";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useSearchParams } from "next/navigation";
import { completeProfile } from "@/services/keycloak/user.service";
import { notification } from "antd";
interface PageProps {
  userId: string;
}

export const CompleteProfile = ({ userId }: PageProps) => {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { push } = useNavigation();

  const form = useForm({
    initialValues: {
      phone: "",
      lawFirmName: "",
      licenseNumber: "",
      practiceArea: "",
    },

    validate: {},
  });
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.validate().hasErrors) {
      return;
    }
    try {
      setIsLoading(true);
      const updateUser = await completeProfile(
        userId,
        form.values.phone,
        form.values.practiceArea,
        form.values.lawFirmName,
        form.values.lawFirmName
      );
      if (!updateUser) throw new Error("Failed to update user.");
      setIsLoading(false);
      push(`/auth/signup/success?key=${searchParams.get("key")}`);
    } catch (err) {
      setIsLoading(false);
      console.log(err);
      notification.error({
        message: "Error",
        description: "Failed to complete your profile. Please try again later.",
      });
    }
  };
  return (
    <div className="relative">
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
        loaderProps={{ color: "pink", type: "bars" }}
      />
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 mt-6">
          <div>
            <div className="text-black text-sm mb-1">
              Phone number<span className="text-red-500 ml-1">*</span>
            </div>
            <PhoneInput
              placeholder="Enter phone number"
              country={"us"}
              value={form.values.phone}
              onChange={(phone) => form.setFieldValue("phone", phone)}
            />
          </div>
          {form.errors.phone && <div>{form.errors.phone}</div>}
          <div className="grid grid-cols-2 gap-2">
            <TextInput
              required
              label="Law Firm Name"
              placeholder="Enter your law firm name"
              value={form.values.lawFirmName}
              onChange={(event) =>
                form.setFieldValue("lawFirmName", event.currentTarget.value)
              }
              error={form.errors.lawFirmName}
              radius="sm"
              labelProps={{ style: { color: "black", marginBottom: "6px" } }}
            />
            <TextInput
              required
              label="License Number"
              placeholder="Enter your license number"
              value={form.values.licenseNumber}
              onChange={(event) =>
                form.setFieldValue("licenseNumber", event.currentTarget.value)
              }
              error={form.errors.licenseNumber}
              radius="sm"
              labelProps={{ style: { color: "black", marginBottom: "6px" } }}
            />
          </div>
          <TextInput
            required
            label="Practice Area"
            placeholder="Enter your email"
            value={form.values.practiceArea}
            onChange={(event) =>
              form.setFieldValue("practiceArea", event.currentTarget.value)
            }
            error={form.errors.practiceArea}
            radius="sm"
            labelProps={{ style: { color: "black", marginBottom: "6px" } }}
          />
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <Button
            variant="filled"
            color="dark.6"
            radius="md"
            size="md"
            style={{ fontSize: "14px" }}
            type="submit"
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};
