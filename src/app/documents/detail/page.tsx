"use client";

import React, { useEffect, useState } from "react";
import { LoadingOverlay, rem, Table } from "@mantine/core";
import {
  useDelete,
  useList,
  useNavigation,
  useOne,
  useParsed,
} from "@refinedev/core";
import Link from "next/link";
import { CitationResponseDto, DocumentResponseDto } from "../../../types/types";
import { IconPaperclip, IconTrash } from "@tabler/icons-react";

interface ExhibitInfo {
  id: string;
  citations: CitationResponseDto[];
}
export default function BlogPostList() {
  const { push } = useNavigation();
  const { mutate: deleteMutate } = useDelete();
  const { params } = useParsed();
  const caseId = params?.caseId;
  const documentId = params?.documentId;
  const [selectedExhibitDocumentId, setSelectedMainDocumentId] =
    useState<string>();
  const [citations, setCitations] = useState<CitationResponseDto[]>([]);
  const [exhibits, setExhibits] = useState<ExhibitInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [caseDocumentsMap, setCaseDocumentsMap] = useState<
    Map<string, DocumentResponseDto>
  >(new Map());
  useEffect(() => {
    if (!caseId || !documentId) {
      push("/cases"); // Redirect if caseId is missing
    }
  }, [caseId, documentId]);
  const { data: documentData, isLoading: documentLoading } = useOne<any>({
    resource: "documents",
    id: documentId,
  });

  const {
    data: documentsData,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = useList<any>({
    resource: `cases/${caseId}/documents`,
    hasPagination: false,
  });

  const {
    data: citationsData,
    isLoading: citationsLoading,
    refetch: refetchCitations,
  } = useList<any>({
    resource: `documents/${documentId}/citations`,
    hasPagination: false,
  });

  useEffect(() => {
    const d = documentsData?.data as any;
    if (d) {
      const allDocuments = d?.items as DocumentResponseDto[];
      const allDocumentsMap = new Map<string, DocumentResponseDto>();
      allDocuments.forEach((doc) => {
        allDocumentsMap.set(doc.id, doc);
      });
      setCaseDocumentsMap(allDocumentsMap);
    }
  }, [documentsData]);

  useEffect(() => {
    const c = citationsData?.data as any;
    if (c) {
      const allCitations = c?.items as CitationResponseDto[];
      setCitations(allCitations);
      const exhibits = [] as ExhibitInfo[];
      allCitations.forEach((citation, i) => {
        if (
          exhibits.find(
            (exhibit) => exhibit.id === citation.destinationDocumentId
          )
        ) {
          exhibits
            .find((exhibit) => exhibit.id === citation.destinationDocumentId)
            ?.citations.push(citation);
        } else {
          exhibits.push({
            id: citation.destinationDocumentId,
            citations: [citation],
          });
        }
      });
      setExhibits(exhibits);
    }
  }, [citationsData]);
  const handleSelectExhibitDocument = (exhibitId: string) => {
    setSelectedMainDocumentId(exhibitId);
  };
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
    setLoading(true);
    deleteMutate(
      {
        resource: `documents/${documentId}/citations`,
        id: citationId,
      },
      {
        onError: (error) => console.log(error),
        onSuccess: () => {
          setLoading(false);
          setCitations(citations.filter((c) => c.id !== citationId));
        },
      }
    );
  };
  return (
    <div className="p-5 h-full flex flex-col">
      <Link href={"/cases"} className="text-[#551a8b] underline text-sm">
        &lt; All cases
      </Link>
      <div className="">{documentData?.data?.title}</div>
      <div className="relative">
        <LoadingOverlay
          visible={documentLoading || documentsLoading || citationsLoading}
          zIndex={1000}
          overlayProps={{ radius: "sm", blur: 2 }}
          loaderProps={{ color: "pink", type: "bars" }}
        />
      </div>
      <div className="grid grid-cols-12 mt-4 flex-1">
        <div className="col-span-5">
          <div className="">
            {exhibits.map((exh, i) => (
              <div
                key={i}
                className={`p-4 border border-r-0 ${
                  i === 0 ? "border-t" : "border-t-0"
                }`}
              >
                <div
                  className={`${
                    selectedExhibitDocumentId === exh.id
                      ? "text-[#099268]"
                      : "text-[#6e6e6e]"
                  } text-sm font-bold cursor-pointer flex gap-2`}
                  onClick={() => handleSelectExhibitDocument(exh.id)}
                >
                  <IconPaperclip style={{ width: rem(20), height: rem(20) }} />
                  {caseDocumentsMap.get(exh.id)?.title}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-7 border relative">
          <LoadingOverlay
            visible={loading}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
            loaderProps={{ color: "pink", type: "bars" }}
          />
          <div className="flex flex-col gap-4">
            <Table
              style={{
                border: "1px solid #eeeeef",
                "th, td": {
                  fontSize: "12px", // Ensures the table headers and cells follow the font size
                },
              }}
              horizontalSpacing="md"
              verticalSpacing="md"
              highlightOnHover
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Source Text</Table.Th>
                  <Table.Th>Destination Page Number</Table.Th>
                  <Table.Th>Creation Source</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {citations
                  .filter(
                    (c) => c.destinationDocumentId === selectedExhibitDocumentId
                  )
                  .map((c, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>{c.sourceText}</Table.Td>
                      <Table.Td>{c.destinationPageNumber}</Table.Td>
                      <Table.Td>{c.creationSource}</Table.Td>
                      <Table.Td>
                        <button
                          onClick={() =>
                            handleDeleteCitation(c.sourceDocumentId, c.id)
                          }
                        >
                          <IconTrash color="red" size={14} />
                        </button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
              </Table.Tbody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
