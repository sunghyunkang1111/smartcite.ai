"use client";

import React, { useEffect, useState } from "react";
import { Button, Table } from "@mantine/core";
import {
  useCreate,
  useDelete,
  useList,
  useNavigation,
  useOne,
  useParsed,
} from "@refinedev/core";
import Link from "next/link";
export interface DocumentResponseDto {
  id: string;
  title: string;
  mediaId: string;
  mediaUrl: string;
  createdAt: string;
  processingStatus: string;
  citationsExtractionStatus: string | null;
  citationsCount: number;
}

export interface CitationResponseDto {
  id: string;
  sourceDocumentId: string;
  sourcePageNumber: number | null;
  sourceRectangleX1: number | null;
  sourceRectangleY1: number | null;
  sourceRectangleX2: number | null;
  sourceRectangleY2: number | null;
  destinationDocumentId: string;
  destinationPageNumber: number | null;
  createdAt: string;
  creationSource: string;
  sourceText: number;
  referencedText: string;
}

export default function BlogPostList() {
  const { mutate: deleteMutate } = useDelete();
  const { push } = useNavigation();
  const { params } = useParsed();
  const documentId = params?.documentId;
  const caseId = params?.caseId;
  const [document, setDocument] = useState<DocumentResponseDto | undefined>(
    undefined
  );
  const [caseDocumentsMap, setCaseDocumentsMap] = useState<
    Map<string, DocumentResponseDto>
  >(new Map());
  const [citations, setCitations] = useState<CitationResponseDto[]>([]);

  useEffect(() => {
    if (!documentId) {
      push("/cases"); // Redirect if caseId is missing
    }
  }, [documentId]);

  const { data: documentData, isLoading: documentLoading } = useOne<any>({
    resource: "documents",
    id: documentId,
  });

  useEffect(() => {
    if (documentData) {
      setDocument(documentData?.data as DocumentResponseDto);
    }
  }, [documentData]);

  const {
    data: citationData,
    isLoading: citationLoading,
    refetch: refetchCitations,
  } = useList<any>({
    resource: `documents/${documentId}/citations`,
    hasPagination: false,
  });

  useEffect(() => {
    const cd = citationData?.data as any;
    if (cd) {
      setCitations(cd?.items as CitationResponseDto[]);
    }
  }, [citationData]);

  const {
    data: documentsData,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = useList<any>({
    resource: `cases/${caseId}/documents`,
    hasPagination: false,
  });

  useEffect(() => {
    const dd = documentsData?.data as any;
    if (dd) {
      const allDocuments = dd.items as DocumentResponseDto[];
      const allDocumentsMap = new Map<string, DocumentResponseDto>();
      allDocuments.forEach((doc) => {
        allDocumentsMap.set(doc.id, doc);
      });
      setCaseDocumentsMap(allDocumentsMap);
    }
  }, [documentsData]);

  const handleDeleteCitation = async (
    documentId: string,
    citationId: string
  ) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this citation?"
    );
    if (!confirmDelete) {
      return;
    }
    deleteMutate(
      {
        resource: `documents/${documentId}/citations`,
        id: citationId,
      },
      {
        onError: (error) => console.log(error),
        onSuccess: () => {
          setCitations(citations.filter((c) => c.id !== citationId));
        },
      }
    );
  };

  return (
    <div className="p-5">
      <Link href={"/cases"} className="text-[#551a8b] underline text-sm">
        &lt; All cases
      </Link>
      <div className="text-sm mt-5">Document {document?.title}</div>
      <div className="text-sm mt-5">Citations</div>
      <div className="mt-6 text-xs">
        <Table
          style={{
            border: "1px solid #eeeeef",
            "th, td": {
              fontSize: "16px", // Ensures the table headers and cells follow the font size
            },
          }}
          verticalSpacing="md"
          highlightOnHover
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th></Table.Th>
              <Table.Th>Source Text</Table.Th>
              <Table.Th>Destination Document</Table.Th>
              <Table.Th>Destination Page Number</Table.Th>
              <Table.Th>Creation Source</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {citations.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.id}</Table.Td>
                <Table.Td>{c.sourceText}</Table.Td>
                <Table.Td>
                  {caseDocumentsMap.get(c.destinationDocumentId)?.title}
                </Table.Td>
                <Table.Td>{c.destinationPageNumber}</Table.Td>
                <Table.Td>{c.creationSource}</Table.Td>
                <Table.Td>
                  <Button
                    variant="danger"
                    size="sm"
                    className="ml"
                    onClick={() =>
                      handleDeleteCitation(c.sourceDocumentId, c.id)
                    }
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
