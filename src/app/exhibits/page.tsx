"use client";

import React, { useEffect, useState } from "react";
import { LoadingOverlay, rem } from "@mantine/core";
import { useList, useNavigation, useOne, useParsed } from "@refinedev/core";
import { Worker } from "@react-pdf-viewer/core";
import Link from "next/link";
import { DocType } from "@utils/util.constants";
import { DocumentResponseDto } from "../../types/types";
import { IconExternalLink } from "@tabler/icons-react";
import { Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

export default function BlogPostList() {
  const { push } = useNavigation();
  const { params } = useParsed();
  const caseId = params?.caseId;
  const [selectedMainDocument, setSelectedMainDocument] =
    useState<DocumentResponseDto>();
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

  return (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
      <div className="p-5 h-full flex flex-col">
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
        <div className="grid grid-cols-10 flex-1">
          <div className="col-span-4 relative">
            {documents
              .filter((doc) => doc.type === DocType.EXHIBIT)
              .map((doc, _i) => (
                <div
                  key={doc.id}
                  className={`border p-4 border-r-0 flex justify-between items-center cursor-pointer
                  ${
                    selectedMainDocument?.id === doc.id
                      ? "text-[#099268]"
                      : "text-[#6e6e6e]"
                  } 
                  ${_i === 0 ? "border-t" : "border-t-0"}`}
                >
                  <div
                    onClick={() => setSelectedMainDocument(doc)}
                    className="font-bold flex gap-2 items-center cursor-pointer text-sm"
                  >
                    <IconExternalLink
                      style={{ width: rem(20), height: rem(20) }}
                    />
                    {doc.title}
                  </div>
                </div>
              ))}
          </div>
          <div className="border col-span-6 p-4">
            {selectedMainDocument && (
              <Viewer fileUrl={selectedMainDocument.mediaUrl} />
            )}
          </div>
        </div>
      </div>
    </Worker>
  );
}
