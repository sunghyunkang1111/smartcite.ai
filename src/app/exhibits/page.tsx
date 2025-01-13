"use client";

import React, { useEffect, useState } from "react";
import { LoadingOverlay } from "@mantine/core";
import { notification, Table } from "antd";
import { useOne, useTable } from "@refinedev/core";
import { Layout as BaseLayout } from "@/components/layout";
import { IconClick } from "@tabler/icons-react";
import { ICase, ICitation, IDocument } from "@/types/types";
import { DocType } from "@/utils/util.constants";
import AddExhibit from "@/components/exhibit/AddExhibit";
import { getCitations } from "@services/citation.service";
// import PdfViewer from "@components/common/PdfViewer";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("@components/common/PdfViewer"), {
  ssr: false,
});

export default function DocumentList() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get("caseId");
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [citationLoading, setCitationLoading] = useState(false);
  const [citations, setCitations] = useState<ICitation[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [selDoc, setSelDoc] = useState<any>();

  const { data: caseData, isLoading: caseLoading } = useOne<ICase>({
    resource: "cases",
    id: caseId || "",
  });
  const matter = caseData?.data;
  const { data: documentData, isLoading: docLoading } = useTable<any>({
    resource: `cases/${caseId}/documents`,
    syncWithLocation: false,
    queryOptions: {
      onError: () => {
        notification.error({
          message: "Error",
          description: "Failed to fetch data. Please try again later.",
        });
      },
    },
  }).tableQueryResult;

  useEffect(() => {
    if (documentData) {
      setDocuments(documentData.items as IDocument[]);
    }
  }, [documentData]);

  useEffect(() => {}, []);
  useEffect(() => {
    if (documents.length > 0 && !docLoading) {
      const fetchCitations = async () => {
        setCitationLoading(true);
        const mainDocs = getMDocs();
        try {
          for (const doc of mainDocs) {
            const res = (await getCitations(doc.id)) as any;
            const newCitations = (res.items as ICitation[]).filter(
              (newCitation) =>
                !citations.some(
                  (existingCitation) => existingCitation.id === newCitation.id
                )
            );
            if (newCitations.length > 0) {
              setCitations((prev) => [...prev, ...newCitations]);
            }
          }

          setCitationLoading(false);
        } catch (error) {
          setCitationLoading(false);
          notification.error({
            message: "Error",
            description: "Failed to fetch citations. Please try again later.",
          });
          console.error("Error fetching citations:", error);
        }
      };
      fetchCitations();
    }
  }, [documents, docLoading]);

  useEffect(() => {
    const processedData = citations
      .map((c) => ({
        key: c.id,
        destinationDocumentName: documents.find(
          (d) => d.id == c.destinationDocumentId
        )?.title,
        sourceDocumentName: documents.find((d) => d.id == c.sourceDocumentId)
          ?.title,
        ...c,
      }))
      .sort((a, b) => {
        if (a.destinationDocumentId < b.destinationDocumentId) return -1;
        if (a.destinationDocumentId > b.destinationDocumentId) return 1;
        return 0;
      });
    if (processedData.length > 0) {
      setSelDoc(processedData[0].destinationDocumentId);
      setTableData(processedData);
    }
  }, [citations]);

  const getMDocs = () => documents.filter((doc) => doc.type === DocType.MAIN);

  // Columns configuration for the table
  const columns = [
    {
      title: "Cited Document(DocID)",
      dataIndex: "destinationDocumentName",
      key: "destinationDocumentName",
      render: (text: string, record: any, index: number) => {
        const prevRecord = index > 0 ? tableData[index - 1] : null;

        // If this is the first occurrence or different from previous
        if (
          !prevRecord ||
          prevRecord.destinationDocumentId !== record.destinationDocumentId
        ) {
          let rowSpan = 1;
          let i = index + 1;
          while (
            i < tableData.length &&
            tableData[i].destinationDocumentId === record.destinationDocumentId
          ) {
            rowSpan++;
            i++;
          }
          return {
            children: (
              <span
                onClick={() => setSelDoc(record.destinationDocumentId)}
                className={`cursor-pointer hover:text-blue-500 ${
                  selDoc == record.destinationDocumentId
                    ? "text-blue-500 font-bold"
                    : ""
                }`}
              >
                {text}
              </span>
            ),
            props: { rowSpan },
          };
        }
        // Return null for cells that should be merged
        return {
          props: { rowSpan: 0 },
        };
      },
    },
    {
      title: "Cited As",
      dataIndex: "sourceText",
      key: "sourceText",
    },
    {
      title: "In Citing Document",
      dataIndex: "sourceDocumentName",
      key: "sourceDocumentName",
    },
  ];

  // Process data to add rowSpan information

  return (
    <BaseLayout>
      <div className="p-6 flex flex-col h-full">
        <div className="flex justify-between">
          <div>
            <div className="text-lg text-[#292929]">
              {matter && (
                <span className="text-xl font-semibold mr-2">
                  {matter?.title}/
                </span>
              )}
              Exhibits
            </div>
            <div className="text-[#7c7c7c] py-2">
              Manage all your exhibits in one place
            </div>
          </div>
          <AddExhibit
            cases={[matter]}
            setDocuments={setDocuments}
            mainDocuments={getMDocs()}
          />
        </div>
        <div className="grid grid-cols-3 mt-6 gap-4 flex-1 relative">
          <LoadingOverlay
            visible={caseLoading || citationLoading}
            zIndex={1000}
            loaderProps={{ color: "black", type: "bars" }}
          />
          <div
            className={`bg-white rounded-xl pb-10 ${
              documents.length > 0 ? "col-span-2" : "col-span-3"
            }`}
          >
            <Table
              dataSource={tableData}
              columns={columns}
              bordered
              pagination={false}
            />
          </div>
          <div
            className={`bg-transparent rounded-xl relative ${
              documents.length > 0 ? "col-span-1" : "hidden"
            }`}
          >
            {!selDoc ? (
              <div className="flex items-center justify-center h-full flex-col gap-2">
                <IconClick size={40} />
                <div className="text-[#292929] mt-4">Document Preview</div>
                <div className="text-[#989898]">
                  Click on an Document to see a PDF Preview
                </div>
              </div>
            ) : (
              <PdfViewer
                mediaUrl={documents.find((d) => d.id == selDoc)?.mediaUrl}
              />
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
