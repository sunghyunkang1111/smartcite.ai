"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  MultiSelect,
  Select as MantineSelect,
  TextInput,
  LoadingOverlay,
} from "@mantine/core";
import { useGetIdentity, useNavigation } from "@refinedev/core";
import Link from "next/link";
import { Layout as BaseLayout } from "@/components/layout";
import { IconArrowLeft } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import {
  getUsersOfOrganization,
  getUserOrganization,
} from "@/services/keycloak/user.service";
import {
  CaseStates,
  CaseStateTextColor,
  ClientRoles,
} from "@/utils/util.constants";
import { notification, Select } from "antd";
import { createCase } from "@services/case.service";

// Types
interface FormValues {
  title: string;
  client: string;
  assignedLawyers: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

// Component
export default function CreateCase() {
  // Hooks
  const { push } = useNavigation();
  const { data: userData, isLoading: userLoading } = useGetIdentity<any>();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [matterState, setMatterState] = useState<string>(CaseStates[0]);
  const [assignedLawyers, setAssignedLawyers] = useState<string[]>([]);
  const [clientRole, setClientRole] = useState(ClientRoles[0]);
  const [assignedLawyerOptions, setAssignedLawyerOptions] = useState<any[]>([]);

  // Form
  const form = useForm<FormValues>({
    initialValues: {
      title: "",
      client: "",
      assignedLawyers: "",
    },
    validate: {
      title: (value) => {
        if (!value) return "Title is required";
        if (!value.match(/^[A-Za-z][A-Za-z0-9/ ]*$/)) {
          return "Title must start with a letter and can only contain letters, numbers, spaces, and forward slashes";
        }
        return null;
      },
      client: (value) => (!value ? "Client is required" : null),
    },
  });

  // Event handlers
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.validate().hasErrors) return;

    setIsLoading(true);
    try {
      const createdCase = await createCase(
        form.values.title,
        form.values.client,
        clientRole,
        assignedLawyers.join(","),
        matterState
      );

      if (!createdCase) throw new Error("Failed to create case");

      notification.success({
        message: "Success",
        description: "Case created successfully",
      });
      push(`/cases/edit?caseId=${createdCase.id}&hideHeader=true`);
    } catch (error) {
      console.error(error);
      notification.error({
        message: "Error",
        description: "Failed to create case",
      });
      // push("/cases");
    } finally {
      setIsLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (!userData) return;
    setAssignedLawyerOptions([{ value: userData?.sub, label: userData?.name }]);
    if (users.length > 0) {
      setAssignedLawyerOptions(
        users.map((user) => ({
          value: user.id,
          label: `${user.firstName} ${user.lastName}`,
        }))
      );
    }
  }, [userData, users]);

  useEffect(() => {
    if (!userData) return;
    const fetchUsers = async () => {
      setUsersLoading(true);
      let users = [{
        id: userData.sub,
        firstName: userData.given_name,
        lastName: userData.family_name
      }]
      setAssignedLawyers([userData.sub])
      try {
        const userOrganizations = await getUserOrganization(
          userData?.sub as string
        );
        if (userOrganizations?.length > 0) {
          const response = await getUsersOfOrganization(userOrganizations[0]?.id);
          users = [...users, ...response]
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        notification.error({
          message: "Error",
          description: "Failed to fetch data",
        });
      } finally {
        setUsersLoading(false);
        setUsers(users);
      }
    };
    fetchUsers();
  }, [userData]);

  // Render helpers
  const renderFormField = (
    label: string,
    name: keyof FormValues,
    placeholder: string
  ) => (
    <TextInput
      required
      label={label}
      placeholder={placeholder}
      value={form.values[name]}
      onChange={(event) => form.setFieldValue(name, event.currentTarget.value)}
      error={form.errors[name]}
      radius="sm"
      labelProps={{
        style: { color: "black", marginBottom: "6px" },
      }}
    />
  );

  const commonInputStyles = {
    input: { backgroundColor: "white" },
    label: { color: "black", marginBottom: "6px" },
  };

  // JSX
  return (
    <BaseLayout>
      <LoadingOverlay
        visible={isLoading || usersLoading || userLoading}
        zIndex={1000}
        loaderProps={{ color: "black", type: "bars" }}
      />
      <div className="p-6 min-h-screen flex flex-col">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/cases"
                className="border rounded-lg p-1.5 border-[#292929]"
              >
                <IconArrowLeft color="#292929" size={24} />
              </Link>
              <div className="text-xl text-[#292929]">Untitled Matter</div>
            </div>
            <div className="flex gap-2">
              {/* <Select
                onChange={setMatterState}
                style={{ width: "120px", height: "100%" }}
                value={matterState}
              >
                {CaseStates.map((state) => (
                  <Select.Option key={state} value={state}>
                    <span style={{ color: CaseStateTextColor[state] }}>
                      {state}
                    </span>
                  </Select.Option>
                ))}
              </Select> */}
              <Button
                variant="default"
                color="dark.6"
                style={{ borderColor: "black", backgroundColor: "white" }}
                component={Link}
                href="/cases"
              >
                Cancel
              </Button>
              <Button variant="" color="dark.6" type="submit">
                Save
              </Button>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 mt-6">
            <div className="text-xl text-[#292929]">General Information</div>
            <div className="mt-3">
              <div className="grid grid-cols-2 gap-4">
                {renderFormField("Title", "title", "Enter title here")}
                {renderFormField("Client", "client", "Enter client here")}
                {/* <MantineSelect
                  label="Client Role"
                  placeholder="Client Role"
                  defaultValue={"Petitioner"}
                  required
                  value={clientRole}
                  onChange={(value) => setClientRole(value as string)}
                  data={ClientRoles}
                  styles={commonInputStyles}
                /> */}
                <MultiSelect
                  label="Assigned Lawyer"
                  required
                  placeholder={assignedLawyers?.length > 0 ? "" : "Assign Lawyers"}
                  data={assignedLawyerOptions}
                  value={assignedLawyers}
                  onChange={setAssignedLawyers}
                  styles={commonInputStyles}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </BaseLayout>
  );
}
