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

export interface CaseResponseDto {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  uploadedDocumentsCount: number;
  citationsCount: number;
}

export default function BlogPostList() {
  const { mutate: createMutate } = useCreate();
  const { mutate: deleteMutate } = useDelete();
  const {
    tableQueryResult: { data, isLoading },
    setCurrent,
    setFilters,
    setSorters,
  } = useTable<any>();
  const [newCase, setNewCase] = useState({ title: "", description: "" });
  const [cases, setCases] = useState<CaseResponseDto[]>([]);
  const handleInputChange = (event: any) => {
    const { name, value } = event.target;
    setNewCase({ ...newCase, [name]: value });
  };
  const handleSubmit = async (event: any) => {
    event.preventDefault();
    createMutate(
      {
        resource: "cases",
        values: newCase,
      },
      {
        onError: (error) => console.log(error),
        onSuccess: () => console.log("success"),
      }
    );
  };
  useEffect(() => {
    if (data) {
      setCases(data.items as CaseResponseDto[]);
    }
  }, [data]);
  const handleExtractCitations = async (caseId: string) => {
    const c = cases.find((c) => c.id === caseId);
    const confirmExtract = window.confirm(
      `Are you sure you want to begin citation extraction for case "${c?.title}"?`
    );
    if (!confirmExtract) {
      return;
    }

    createMutate(
      {
        resource: `cases/${caseId}/extract-citations`,
        values: {},
      },
      {
        onError: (error) => console.log(error),
        onSuccess: () => console.log("success"),
      }
    );
  };
  const handleDelete = async (caseId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this case?"
    );
    if (!confirmDelete) {
      return;
    }

    deleteMutate(
      {
        resource: `cases`,
        id: caseId,
      },
      {
        onError: (error) => console.log(error),
        onSuccess: () => console.log("success"),
      }
    );

    const updatedCases = cases.filter((c) => c.id !== caseId);
    setCases(updatedCases);
  };
  return (
    <div className="p-5">
      <div className="text-sm">Create New Case</div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 mt-5">
          <Input.Wrapper description="Title">
            <Input name="title" onChange={handleInputChange} required />
          </Input.Wrapper>
          <Input.Wrapper description="Description">
            <Input name="description" onChange={handleInputChange} required />
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
              <Table.Th>Title</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Citation</Table.Th>
              <Table.Th>Documents</Table.Th>
              <Table.Th>Actions</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {cases.map((caseItem: CaseResponseDto) => (
              <Table.Tr>
                <Table.Td>{caseItem.title}</Table.Td>
                <Table.Td>{caseItem.description}</Table.Td>
                <Table.Td>{caseItem.citationsCount}</Table.Td>
                <Table.Td>
                  {/* <div className="text-[#99a9ee] hover:underline cursor-pointer"> */}
                  <Link
                    href={`/documents?caseId=${caseItem.id}`}
                    className="text-[#99a9ee] hover:underline cursor-pointer"
                  >
                    View {caseItem.uploadedDocumentsCount} document(s)
                  </Link>
                  {/* </div> */}
                </Table.Td>
                <Table.Td>
                  <Button
                    variant="outline"
                    color="violet.7"
                    type="submit"
                    size="xs"
                    onClick={() => handleExtractCitations(caseItem.id)}
                  >
                    Extract Citations
                  </Button>
                </Table.Td>
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
