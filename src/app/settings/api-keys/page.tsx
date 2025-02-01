"use client";

import React, { useEffect, useState } from "react";
import { Button, Input, LoadingOverlay } from "@mantine/core";
import { useCreate, useDelete, useTable } from "@refinedev/core";
import { IApiKey } from "@/types/types";
import { notification, Table, type TableColumnType } from "antd";
import DeleteConfirmModal from "@components/common/DeleteBtnWithConfirmModal";
import { IconTrash } from "@tabler/icons-react";
import { getFormatedDate } from "@utils/util.functions";
import { SettingLayout } from "@/components/settings/SettingLayout";

export default function ApiKey() {
  const { mutate: createMutate } = useCreate();
  const { mutate: deleteMutate } = useDelete();
  const {
    tableQueryResult: { data, isLoading: isApikeyLoading },
  } = useTable<any>({
    hasPagination: false,
    resource: "api-keys",
    queryOptions: {
      onError: () => {
        notification.error({
          message: "Error",
          description: "Failed to fetch API keys. Please try again later.",
        });
      },
    },
  });
  const [newApiKey, setNewApiKey] = useState({ name: "" });
  const [apiKeys, setApiKeys] = useState<IApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const handleInputChange = (event: any) => {
    const { name, value } = event.target;
    setNewApiKey({ ...newApiKey, [name]: value });
  };
  const handleSubmit = async (event: any) => {
    event.preventDefault();
    setIsLoading(true);
    createMutate(
      {
        resource: "api-keys",
        values: {
          name: newApiKey.name,
        },
      },
      {
        onError: () => {
          setIsLoading(false);
          notification.error({
            message: "Error",
            description: "Failed to create API key. Please try again later.",
          });
        },
        onSuccess: (res) => {
          setIsLoading(false);
          setApiKeys([...apiKeys, res.data as IApiKey]);
          setNewApiKey({ name: "" });
          notification.success({
            message: "Success",
            description: "API key created successfully.",
          });
        },
      }
    );
  };
  useEffect(() => {
    if (data) {
      const d = data.data as any;
      setApiKeys(d?.items);
    }
  }, [data]);

  const handleDelete = async (apiKeyId: string) => {
    setIsLoading(true);
    deleteMutate(
      {
        resource: `api-keys`,
        id: apiKeyId,
      },
      {
        onError: () => {
          setIsLoading(false);
          notification.error({
            message: "Error",
            description: "Failed to delete API key. Please try again later.",
          });
        },
        onSuccess: () => {
          setIsLoading(false);
          const updatedApiKeys = apiKeys.filter((c) => c.id !== apiKeyId);
          setApiKeys(updatedApiKeys);
          notification.success({
            message: "Success",
            description: "API key deleted successfully.",
          });
        },
      }
    );
  };

  const columns: TableColumnType<IApiKey>[] = [
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
      sorter: (a: IApiKey, b: IApiKey) => a.name.localeCompare(b.name),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      sorter: (a: IApiKey, b: IApiKey) => a.key.localeCompare(b.key),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a: IApiKey, b: IApiKey) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      sortDirections: ["ascend", "descend"],
      render: (createdAt: string) => getFormatedDate(createdAt),
    },
    {
      title: "Action",
      dataIndex: "",
      key: "action",
      render: (value, record) => (
        <div className="flex gap-2 items-center text-[#c5c5c5]">
          <DeleteConfirmModal
            onDelete={() => handleDelete(record.id)}
            trigger={
              <div className="cursor-pointer hover:text-[#2e2e2e]">
                <IconTrash size={18} />
              </div>
            }
          />
        </div>
      ),
    },
  ];
  return (
    <SettingLayout>
      <div className="mt-2">
        <div className="text-2xl text-[#292929] font-bold pb-4">API Keys</div>
        <form onSubmit={handleSubmit} className="bg-white px-5 py-5 rounded-lg">
          <div className="flex flex-col gap-4">
            <Input.Wrapper description="Name">
              <Input
                name="name"
                value={newApiKey.name}
                onChange={handleInputChange}
                required
              />
            </Input.Wrapper>
            <Button
              variant="default"
              style={{ width: "150px", fontWeight: "normal" }}
              type="submit"
            >
              Create API Key
            </Button>
          </div>
        </form>
        <div className="mt-6 text-xs bg-white rounded-lg relative">
          <LoadingOverlay
            visible={isApikeyLoading || isLoading}
            zIndex={1000}
            loaderProps={{ color: "black", type: "bars" }}
          />
          <Table<IApiKey>
            columns={columns}
            dataSource={apiKeys}
            components={{
              header: {
                cell: (props: any) => (
                  <th
                    {...props}
                    style={{
                      color: "#989898", // Optional
                      padding: "12px 16px", // Adjust these values as needed
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
                      padding: "6px 16px", // Adjust these values as needed
                      color: "#7c7c7c",
                    }}
                  />
                ),
              },
            }}
          />
        </div>
      </div>
    </SettingLayout>
  );
}
