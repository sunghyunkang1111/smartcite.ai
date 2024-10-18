"use client";

import React, { useEffect, useState } from "react";
import { LoadingOverlay } from "@mantine/core";
import { useList, useNavigation, useOne, useParsed } from "@refinedev/core";
import Link from "next/link";
import DocumentList from "@components/documents/DocumentList";
import { DocType } from "@utils/util.constants";
import { DocumentResponseDto } from "../../types/types";

export default function BlogPostList() {
  const { push } = useNavigation();
  const { params } = useParsed();
  const caseId = params?.caseId;
  const [selectedMainDocumentId, setSelectedMainDocumentId] =
    useState<string>();
  const [documents, setDocuments] = useState<DocumentResponseDto[]>([]);
  useEffect(() => {
    if (!caseId) {
      push("/cases"); // Redirect if caseId is missing
    }
  }, [caseId]);
  const { data: caseData, isLoading: caseLoading } = useOne<any>({
    resource: "cases",
    id: caseId,
  });

  const {
    data: documentData,
    isLoading: documentLoading,
    refetch: refetchDocuments,
  } = useList<any>({
    resource: `cases/${caseId}/documents`,
    hasPagination: false,
  });

  useEffect(() => {
    const d = documentData?.data as any;
    if (d) {
      const allDocuments = d?.items as DocumentResponseDto[];
      setDocuments(allDocuments);
    }
  }, [documentData]);

  const handleSelectMainDocument = (documentId: string) => {
    setSelectedMainDocumentId(documentId);
  };
  return (
    <div className="p-5">
      <Link href={"/cases"} className="text-[#551a8b] underline text-sm">
        &lt; All cases
      </Link>
      <div className="text-sm mt-5">Case {caseData?.data.title}</div>
      <div className="relative">
        <LoadingOverlay
          visible={caseLoading || documentLoading}
          zIndex={1000}
          overlayProps={{ radius: "sm", blur: 2 }}
          loaderProps={{ color: "pink", type: "bars" }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DocumentList
          documents={documents}
          relatedMainDocumentId={DocType.MAIN}
          selectedMainDocumentId={selectedMainDocumentId}
          caseId={caseId}
          setDocuments={setDocuments}
          handleSelectRow={handleSelectMainDocument}
          dockType={DocType.MAIN}
          refetchDocument={refetchDocuments}
        />
        <DocumentList
          documents={documents}
          relatedMainDocumentId={selectedMainDocumentId as string}
          caseId={caseId}
          setDocuments={setDocuments}
          dockType={DocType.EXHIBIT}
          refetchDocument={refetchDocuments}
        />
      </div>
    </div>
  );
}
