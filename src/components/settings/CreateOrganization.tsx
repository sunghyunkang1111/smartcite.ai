"use client";

import { Button, LoadingOverlay, NumberInput, TextInput } from "@mantine/core";
import { FormEvent, KeyboardEvent, useState } from "react";
import { useForm } from "@mantine/form";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  addGroupToUser,
  addUserToOrganization,
  createOrganization,
  getSuperAdminToken,
  removeGroupFromUser,
  sendInviteEmail,
} from "@/services/keycloak/user.service";
import { IconX } from "@tabler/icons-react";
import { getAllGroups } from "@services/keycloak/group.service";
import { Group } from "@utils/util.constants";
import { notification } from "antd";

interface PageProps {
  userId: string;
  setOrganizationId: (organizationId: string) => void;
  getOrganizationData: () => void;
  setIsAdmin: (isAdmin: boolean) => void;
}

interface FormValues {
  teamName: string;
  numberOfTeamMembers: string;
  adminName: string;
  phone: string;
  inviteEmail: string;
}

export const CreateOrganization = ({
  userId,
  setOrganizationId,
  getOrganizationData,
  setIsAdmin,
}: PageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);

  const form = useForm<FormValues>({
    initialValues: {
      teamName: "",
      numberOfTeamMembers: "",
      adminName: "",
      phone: "",
      inviteEmail: "",
    },
    validate: {
      teamName: (value) => (value.length > 0 ? null : "Team name is required."),
      adminName: (value) =>
        value.length > 0 ? null : "Admin name is required.",
      inviteEmail: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Please enter a valid email address.",
    },
  });

  const handleGroupOperations = async (adminToken: any) => {
    try {
      const groups = await getAllGroups(adminToken?.access_token);
      if (!groups) throw new Error("Failed to retrieve groups.");

      const adminGroupId = groups.find(
        (group: any) => group.name === Group.ADMIN
      )?.id;
      const userGroupId = groups.find(
        (group: any) => group.name === Group.USER
      )?.id;

      const makeUserAdmin = await addGroupToUser(
        userId,
        adminGroupId,
        adminToken?.access_token
      );

      if (makeUserAdmin !== "Successfully added group to user") {
        throw new Error("Failed to make user admin.");
      }

      const removeUserUser = await removeGroupFromUser(
        userId,
        userGroupId,
        adminToken?.access_token
      );
      if (removeUserUser !== "Successfully removed group from user") {
        throw new Error("Failed to remove user admin.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOrganizationCreation = async (adminToken: any) => {
    const { teamName, numberOfTeamMembers, adminName, phone } = form.values;

    const createdOrgId = await createOrganization(
      teamName,
      numberOfTeamMembers,
      adminName,
      phone,
      adminToken?.access_token
    );
    if (!createdOrgId) throw new Error("Failed to create an organization.");

    const addUserToOrg = await addUserToOrganization(
      userId,
      createdOrgId,
      adminToken?.access_token
    );
    if (!addUserToOrg) throw new Error("Failed to add user to organization.");

    return createdOrgId;
  };

  const handleInviteEmails = async (orgId: string, adminToken: any) => {
    for (const email of inviteEmails) {
      const sendInvite = await sendInviteEmail(
        email,
        orgId,
        adminToken?.access_token
      );
      if (!sendInvite) throw new Error("Failed to send invite email.");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const adminToken = await getSuperAdminToken();
      if (!adminToken) throw new Error("Failed to retrieve admin token.");

      await handleGroupOperations(adminToken);
      const orgId = await handleOrganizationCreation(adminToken);
      await handleInviteEmails(orgId, adminToken);
      notification.success({
        message: "Success",
        description: "Emails sent successfully.",
      });
      notification.success({
        message: "Success",
        description: "Organization created successfully.",
      });
      setOrganizationId(orgId);
      setIsAdmin(true);
      getOrganizationData();
    } catch (err) {
      console.error(err);
      notification.error({
        message: "Error",
        description: "Failed to create organization. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterEmail = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (form.validate().hasErrors) return;
      const newEmail = event.currentTarget.value.trim();
      if (newEmail) {
        setInviteEmails([...inviteEmails, newEmail]);
        form.setFieldValue("inviteEmail", "");
      }
    }
  };

  const removeEmail = (index: number) => {
    setInviteEmails(inviteEmails.filter((_, i) => i !== index));
  };

  return (
    <div className="relative bg-white px-5 py-5 rounded-lg">
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
        loaderProps={{ color: "pink", type: "bars" }}
      />
      <div className="text-2xl text-[#292929] font-bold pb-4">
        Create Organization
      </div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
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
                  onClick={() => removeEmail(index)}
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
