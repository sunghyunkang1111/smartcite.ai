"use client";

import React, { KeyboardEvent, useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { IUser } from "@/types/types";
import { notification, Table, type TableColumnType } from "antd";
import { IconX } from "@tabler/icons-react";
import {
  getUserOrganization,
  getUsersOfOrganization,
  sendInviteEmail,
} from "@services/keycloak/user.service";
import { Button, LoadingOverlay, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { getAccessToken } from "@services/auth.service";
import { Roles } from "@utils/util.constants";
import { CreateOrganization } from "@components/settings/CreateOrganization";
import { SettingLayout } from "@/components/settings/SettingLayout";
import LeaveBtnWithConfirmModal from "@components/common/LeaveBtnWithConfirmModal";
import { leaveOrganization } from "@services/keycloak/organization.service";

interface TeamPageState {
  users: IUser[];
  inviteEmails: string[];
  organizationId: string | null;
  organizationData: any;
  isInviteLoading: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

export default function TeamsPage() {
  const [state, setState] = useState<TeamPageState>({
    users: [],
    inviteEmails: [],
    organizationId: null,
    organizationData: null,
    isInviteLoading: false,
    isAdmin: false,
    isLoading: true,
  });

  const { data: userData, isLoading: isUserDataLoading } =
    useGetIdentity<any>();

  const form = useForm({
    initialValues: {
      inviteEmail: "",
    },
    validate: {
      inviteEmail: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Please enter a valid email address.",
    },
  });

  const tableColumns: TableColumnType<IUser>[] = [
    {
      title: "#",
      dataIndex: "",
      key: "index",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: IUser, b: IUser) => a.firstName.localeCompare(b.firstName),
      sortDirections: ["ascend", "descend"],
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a: IUser, b: IUser) => a.email.localeCompare(b.email),
      sortDirections: ["ascend", "descend"],
    },
  ];

  const getOrganizationData = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const organizationData = await getUserOrganization(userData.sub);
      if (organizationData[0]?.id) {
        const users = await getUsersOfOrganization(organizationData[0].id);

        setState((prev) => ({
          ...prev,
          organizationData: organizationData[0],
          organizationId: organizationData[0].id,
          users,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch organization data:", error);
      notification.error({
        message: "Error",
        description:
          "Failed to fetch organization data. Please try again later.",
      });
      setState((prev) => ({
        ...prev,
        organizationId: null,
        users: [],
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleEnterEmail = (event: KeyboardEvent<HTMLInputElement>) => {
    if (form.validate().hasErrors) return;
    if (event.key === "Enter") {
      event.preventDefault();
      console.log(event);
      setState((prev) => ({
        ...prev,
        inviteEmails: [...prev.inviteEmails, form.values.inviteEmail],
      }));
      form.setFieldValue("inviteEmail", "");
    }
  };

  const handleInviteUsers = async () => {
    setState((prev) => ({ ...prev, isInviteLoading: true }));
    try {
      const token = await getAccessToken();
      await Promise.all(
        state.inviteEmails.map((email) =>
          sendInviteEmail(email, state.organizationId as string, token || "")
        )
      );
      setState((prev) => ({ ...prev, inviteEmails: [] }));
      notification.success({
        message: "Success",
        description: "Invite emails sent successfully.",
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to send invite emails.",
      });
    } finally {
      setState((prev) => ({ ...prev, isInviteLoading: false }));
    }
  };

  const handleLeaveTeam = async () => {
    try {
      const token = await getAccessToken();
      const leaveOrg = await leaveOrganization(
        state.organizationId as string,
        userData?.sub as string,
        token || ""
      );
      if (leaveOrg !== "Success") throw new Error("Failed to leave team.");

      setState((prev) => ({
        ...prev,
        isAdmin: false,
        organizationId: null,
      }));

      notification.success({
        message: "Success",
        description: "You have successfully left the team.",
      });
    } catch (error) {
      console.error("Failed to leave team:", error);
      notification.error({
        message: "Error",
        description: "Failed to leave team.",
      });
    }
  };

  useEffect(() => {
    if (!userData) return;
    setState((prev) => ({
      ...prev,
      isAdmin: userData.roles.includes(Roles.ADMIN),
    }));
    getOrganizationData();
  }, [userData]);

  if (state.isLoading || isUserDataLoading) {
    return (
      <SettingLayout>
        <div className="mt-2 h-full">
          <div className="text-2xl text-[#292929] font-bold pb-4">Teams</div>
          <div className="h-full relative">
            <LoadingOverlay
              visible={true}
              zIndex={1000}
              overlayProps={{ radius: "sm", blur: 2 }}
              loaderProps={{ color: "black", type: "bars" }}
            />
          </div>
        </div>
      </SettingLayout>
    );
  }

  return (
    <SettingLayout>
      <div className="mt-2 relative">
        <div className="flex justify-between items-center">
          <div className="text-2xl text-[#292929] font-bold pb-4">
            {state.organizationData?.name || "Teams"}
          </div>
          {!state.isAdmin && state.organizationId && (
            <LeaveBtnWithConfirmModal
              onDelete={handleLeaveTeam}
              trigger={<Button variant="default">Leave</Button>}
            />
          )}
        </div>

        {!state.organizationId && (
          <CreateOrganization
            userId={userData?.sub as string}
            setOrganizationId={(id) =>
              setState((prev) => ({ ...prev, organizationId: id }))
            }
            setIsAdmin={(isAdmin) => setState((prev) => ({ ...prev, isAdmin }))}
            getOrganizationData={getOrganizationData}
          />
        )}

        {state.isAdmin && state.organizationId && (
          <div className="bg-white px-5 py-5 rounded-lg mb-4">
            <div className="flex flex-col">
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
                labelProps={{
                  style: { color: "black", marginBottom: "6px" },
                }}
              />
              <div className="flex gap-2 flex-wrap mt-2">
                {state.inviteEmails.map((email, index) => (
                  <div
                    key={index}
                    className="bg-[#f6f6f6] pl-4 pr-2 py-0.5 rounded-md text-sm flex gap-2 items-center"
                  >
                    <div>{email}</div>
                    <div
                      className="cursor-pointer bg-[#f1f1f1]"
                      onClick={() => {
                        setState((prev) => ({
                          ...prev,
                          inviteEmails: prev.inviteEmails.filter(
                            (_, i) => i !== index
                          ),
                        }));
                      }}
                    >
                      <IconX size={16} />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                loading={state.isInviteLoading}
                variant="default"
                style={{
                  width: "150px",
                  fontWeight: "normal",
                  marginTop: "4px",
                }}
                onClick={handleInviteUsers}
                disabled={state.inviteEmails.length === 0}
              >
                Invite User
              </Button>
            </div>
          </div>
        )}

        {state.organizationId && (
          <div className="text-xs bg-white rounded-lg relative">
            <Table<IUser>
              columns={tableColumns}
              dataSource={state.users}
              components={{
                header: {
                  cell: (props: any) => (
                    <th
                      {...props}
                      style={{
                        color: "#989898",
                        padding: "12px 16px",
                        fontWeight: "semibold",
                      }}
                    />
                  ),
                },
                body: {
                  cell: (props: any) => (
                    <td
                      {...props}
                      style={{
                        padding: "6px 16px",
                        color: "#7c7c7c",
                      }}
                    />
                  ),
                },
              }}
            />
          </div>
        )}
      </div>
    </SettingLayout>
  );
}
