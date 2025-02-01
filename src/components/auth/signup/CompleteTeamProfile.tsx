"use client";

import { Button, LoadingOverlay, NumberInput, TextInput } from "@mantine/core";
import { useNavigation } from "@refinedev/core";
import { FormEvent, KeyboardEvent, useState } from "react";
import { useForm } from "@mantine/form";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useSearchParams } from "next/navigation";
import {
  addUserToOrganization,
  createOrganization,
  getSuperAdminToken,
  sendInviteEmail,
} from "@/services/keycloak/user.service";
import { IconX } from "@tabler/icons-react";
import { notification } from "antd";

interface PageProps {
  userId: string;
}

export const CompleteTeamProfile = ({ userId }: PageProps) => {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { push } = useNavigation();
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);

  const form = useForm({
    initialValues: {
      teamName: "",
      numberOfTeamMembers: "",
      adminName: "",
      phone: "",
      inviteEmail: "",
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

      const adminToken = await getSuperAdminToken();
      if (!adminToken) throw new Error("Failed to retrieve admin token.");
      const createdOrgId = await createOrganization(
        form.values.teamName,
        form.values.numberOfTeamMembers,
        form.values.adminName,
        form.values.phone,
        adminToken?.access_token
      );
      if (!createdOrgId) throw new Error("Failed to create an organization.");
      const adduserToOrg = await addUserToOrganization(
        userId,
        createdOrgId,
        adminToken?.access_token
      );
      if (!adduserToOrg) throw new Error("Failed to add user to organization.");
      for (const email of inviteEmails) {
        const sendInvite = await sendInviteEmail(
          email,
          createdOrgId,
          adminToken?.access_token
        );
        if (!sendInvite) throw new Error("Failed to send invite email.");
      }
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
  const handleEnterEmail = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setInviteEmails([...inviteEmails, event.currentTarget.value]);
      form.setFieldValue("inviteEmail", "");
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
          <div className="grid grid-cols-2 gap-2">
            <TextInput
              required
              label="Team Name"
              placeholder="Enter your team name"
              value={form.values.teamName}
              onChange={(event) =>
                form.setFieldValue("teamName", event.currentTarget.value)
              }
              error={form.errors.teamName}
              radius="sm"
              labelProps={{ style: { color: "black", marginBottom: "6px" } }}
            />
            <NumberInput
              required
              label="Number of Team Members"
              placeholder="Enter number of team members"
              value={form.values.numberOfTeamMembers}
              onChange={(value) =>
                form.setFieldValue("numberOfTeamMembers", value as string)
              }
              error={form.errors.numberOfTeamMembers}
              radius="sm"
              labelProps={{ style: { color: "black", marginBottom: "6px" } }}
            />
          </div>
          <TextInput
            required
            label="Team Administrator's Full Name"
            placeholder="Enter your email"
            value={form.values.adminName}
            onChange={(event) =>
              form.setFieldValue("adminName", event.currentTarget.value)
            }
            error={form.errors.adminName}
            radius="sm"
            labelProps={{ style: { color: "black", marginBottom: "6px" } }}
          />
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
          <TextInput
            label="Invite Team Member"
            placeholder="Enter your team member email"
            value={form.values.inviteEmail}
            onChange={(event) =>
              form.setFieldValue("inviteEmail", event.currentTarget.value)
            }
            onKeyDown={handleEnterEmail}
            error={form.errors.inviteEmail}
            radius="sm"
            labelProps={{ style: { color: "black", marginBottom: "6px" } }}
          />
          <div className="flex gap-2 flex-wrap">
            {inviteEmails.map((email, index) => (
              <div
                key={index}
                className="bg-[#f6f6f6] pl-4 pr-2 py-0.5 rounded-md text-sm flex gap-2 items-center"
              >
                <div>{email}</div>
                <div
                  className="cursor-pointer bg-[#f1f1f1]"
                  onClick={() => {
                    setInviteEmails(inviteEmails.filter((_, i) => i !== index));
                  }}
                >
                  <IconX size={16} />
                </div>
              </div>
            ))}
          </div>
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
