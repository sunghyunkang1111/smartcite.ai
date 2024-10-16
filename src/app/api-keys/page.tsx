"use client";

import React, { useEffect, useState } from "react";
import { Button, Input, Table } from "@mantine/core";
import {
  GetManyResponse,
  useCreate,
  useDelete,
  useTable,
} from "@refinedev/core";
import Link from "next/link";

export interface ApiKeyResponseDto {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function BlogPostList() {
  const { mutate: createMutate } = useCreate();
  const { mutate: deleteMutate } = useDelete();
  const {
    tableQueryResult: { data, isLoading },
  } = useTable<any>();
  const [newApiKey, setNewApiKey] = useState({ name: "" });
  const [apiKeys, setApiKeys] = useState<ApiKeyResponseDto[]>([]);
  const handleInputChange = (event: any) => {
    const { name, value } = event.target;
    console.log(name, value);
    setNewApiKey({ ...newApiKey, [name]: value });
  };
  const handleSubmit = async (event: any) => {
    event.preventDefault();
    createMutate(
      {
        resource: "api-keys",
        values: {
          name: newApiKey.name,
        },
      },
      {
        onError: (error) => console.log(error),
        onSuccess: (res) => {
          setApiKeys([...apiKeys, res.data as ApiKeyResponseDto]);
          setNewApiKey({ name: "" });
        },
      }
    );
  };
  useEffect(() => {
    if (data) {
      setApiKeys(data.items as ApiKeyResponseDto[]);
    }
  }, [data]);

  const handleDelete = async (apiKeyId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this apiKey?"
    );
    if (!confirmDelete) {
      return;
    }

    deleteMutate(
      {
        resource: `api-keys`,
        id: apiKeyId,
      },
      {
        onError: (error) => console.log(error),
        onSuccess: () => {
          const updatedApiKeys = apiKeys.filter((c) => c.id !== apiKeyId);
          setApiKeys(updatedApiKeys);
        },
      }
    );
  };
  return (
    <div className="p-5">
      <div className="text-sm">Create New Case</div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 mt-5">
          <Input.Wrapper description="Name">
            <Input
              name="name"
              value={newApiKey.name}
              onChange={handleInputChange}
              required
            />
          </Input.Wrapper>
          <Button
            variant="outline"
            style={{ width: "150px", fontWeight: "normal" }}
            color="violet.7"
            type="submit"
          >
            Create Case
          </Button>
        </div>
      </form>
      <div className="mt-6 text-xs">
        <Table
          style={{
            border: "1px solid #eeeeef",
            "th, td": {
              fontSize: "16px", // Ensures the table headers and cells follow the font size
            },
          }}
          horizontalSpacing="md"
          verticalSpacing="md"
          highlightOnHover
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Key</Table.Th>
              <Table.Th>Last used</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {apiKeys.map((caseItem: ApiKeyResponseDto) => (
              <Table.Tr>
                <Table.Td>{caseItem.name}</Table.Td>
                <Table.Td>{caseItem.key}</Table.Td>
                <Table.Td>{caseItem.lastUsedAt}</Table.Td>
                <Table.Td>{caseItem.createdAt}</Table.Td>
                <Table.Td>
                  <Button
                    variant="outline"
                    color="red.9"
                    type="submit"
                    size="xs"
                    onClick={() => handleDelete(caseItem.id)}
                  >
                    Delete
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
    </div>
  );
}
