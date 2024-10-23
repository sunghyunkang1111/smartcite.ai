"use client";

import React, { useEffect, useState } from "react";
import { Button, Input, Modal, Table } from "@mantine/core";
import {
  GetManyResponse,
  useCreate,
  useDelete,
  useTable,
  useUpdate,
} from "@refinedev/core";
import Link from "next/link";
import { useDisclosure } from "@mantine/hooks";

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
  const { mutate: UpdateMutate } = useUpdate();
  const { mutate: deleteMutate } = useDelete();
  const [opened, { open, close }] = useDisclosure(false);
  const {
    tableQueryResult: { data, isLoading },
    setCurrent,
    setFilters,
    setSorters,
  } = useTable<any>({
    syncWithLocation: false
  });
  const [newCase, setNewCase] = useState({ title: "", description: "" });
  const [cases, setCases] = useState<CaseResponseDto[]>([]);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const handleInputChange = (event: any) => {
    const { name, value } = event.target;
    setNewCase({ ...newCase, [name]: value });
  };
  const handleSubmit = () => {
    if (selectedCase) {
      UpdateMutate(
        {
          resource: "cases",
          id: selectedCase as string,
          values: newCase,
        },
        {
          onError: (error) => console.log(error),
          onSuccess: () => close(),
        }
      );
    } else {
      createMutate(
        {
          resource: "cases",
          values: newCase,
        },
        {
          onError: (error) => console.log(error),
          onSuccess: () => {
            close();
          },
        }
      );
    }
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

  const handleCreateModal = () => {
    setSelectedCase(null);
    setNewCase({
      title: "",
      description: "",
    });
    open();
  };
  const handleEditModal = (caseItem: CaseResponseDto) => {
    setSelectedCase(caseItem.id);
    setNewCase({
      title: caseItem.title,
      description: caseItem.description,
    });
    open();
  };
  const handleCloseModal = () => {
    close();
  };

  return (
    <div className="p-5">
      <div className="flex justify-between">
        <div className="text-3xl text-black">
          Matters
          <span className="text-sm ml-3 mr-1">/</span>
          <span className="text-sm">All documents</span>
        </div>
        <div className="">
          <Button
            variant="outline"
            color="violet.7"
            type="submit"
            onClick={handleCreateModal}
          >
            Create Case
          </Button>
        </div>
      </div>
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
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {cases.map((caseItem: CaseResponseDto) => (
              <Table.Tr key={caseItem.id}>
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
                  <div className="flex gap-2">
                    <Link
                      href={`/exhibits?caseId=${caseItem.id}`}
                      className="text-[#228be8] border border-[#228be8] cursor-pointer flex items-center justify-center px-4 rounded text-xs"
                    >
                      View Exhibits
                    </Link>
                    <Button
                      variant="outline"
                      type="submit"
                      size="xs"
                      onClick={() => handleExtractCitations(caseItem.id)}
                    >
                      Extract Citations
                    </Button>
                    <Button
                      variant="outline"
                      type="submit"
                      size="xs"
                      onClick={() => handleEditModal(caseItem)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      color="red.9"
                      type="submit"
                      size="xs"
                      onClick={() => handleDelete(caseItem.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
      <Modal
        opened={opened}
        onClose={close}
        title={`${selectedCase ? "Edit" : "Create"}  Case`}
      >
        <div className="flex flex-col gap-4">
          <Input.Wrapper description="Title">
            <Input
              name="title"
              onChange={handleInputChange}
              required
              value={newCase.title}
            />
          </Input.Wrapper>
          <Input.Wrapper description="Description">
            <Input
              name="description"
              onChange={handleInputChange}
              required
              value={newCase.description}
            />
          </Input.Wrapper>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="submit"
              onClick={() => handleSubmit()}
            >
              {selectedCase ? "Edit" : "Create"}
            </Button>
            <Button variant="default" type="submit" onClick={handleCloseModal}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
