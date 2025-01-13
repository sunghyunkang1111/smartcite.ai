"use client";

import React, { useEffect, useState } from "react";
import { Input, LoadingOverlay } from "@mantine/core";
import { notification, type TableColumnType } from "antd";
import { useNavigation, useOne, useTable } from "@refinedev/core";
import { Layout as BaseLayout } from "@/components/layout";
import { IconClick, IconEye, IconSearch } from "@tabler/icons-react";
import { ICase, ICitation, IDocument } from "@/types/types";
import { DocType } from "@/utils/util.constants";
import MyTable from "@/components/common/MyTable";
import { useDisclosure } from "@mantine/hooks";
import AddExhibit from "@/components/exhibit/AddExhibit";
import ExhibitDetailDrawer from "@/components/exhibit/ExhibitDetailDrawer";
import { getCitations } from "@services/citation.service";
// import PdfViewer from "@components/common/PdfViewer";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import CitationsList from "@components/exhibit/CitationsList";
import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("@components/common/PdfViewer"), { ssr: false });

export default function DocumentList() {
  // State Management
  const { push } = useNavigation();
  const searchParams = useSearchParams();
  const caseId = searchParams.get("caseId");
  const documentId = searchParams.get("documentId");
  const [searchKey, setSearchKey] = useState("");
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [selExh, setSelExh] = useState<any>();
  const [citations, setCitations] = useState<ICitation[]>([]);
  const [mainDocuments, setMainDocuments] = useState<any[]>([]);
  const [selDoc, setSelDoc] = useState<any>();
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const [expandedMainDocs, setExpandedMainDocs] = useState<string[]>([]);
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

  const handleDocumentClick = (record: any) => {
    setSelDoc(record);
  };

  const handleViewDetails = (record: any) => {
    setSelExh(record);
    openDrawer();
  };

  const getCitedInMainDocuments = (exhDocId: string) => {
    const exhDoc = documents.find((doc) => doc.id === exhDocId);
    if (!exhDoc) return [];

    const citationsByDoc = citations
      .filter((citation) => citation.destinationDocumentId === exhDocId)
      .reduce((acc: { [key: string]: string[] }, citation) => {
        const sourceDocId = citation.sourceDocumentId;
        if (!acc[sourceDocId]) {
          acc[sourceDocId] = [];
        }
        acc[sourceDocId].push(citation.sourceText);
        return acc;
      }, {});

    const citedInMainDocInfos = Object.entries(citationsByDoc).map(
      ([sourceDocId, sourceTexts]) => ({
        doc: documents.find((d) => d.id === sourceDocId),
        sourceTexts: sourceTexts,
      })
    );
    return citedInMainDocInfos;
  };
  useEffect(() => {
    if (!caseId) {
      push(`/cases`);
    }
  }, [caseId]);
  // useEffect(() => {
  //   if (caseData) {
  //     setCases(caseData.items as ICase[]);
  //     const getDocs = async () => {
  //       setDocLoading(true);
  //       try {
  //         for (const c of caseData.items) {
  //           const docs = (await getDocumentsByCaseId(c.id)) as any;
  //           setDocuments((prev) => [...prev, ...(docs?.items || [])]);
  //         }
  //       } catch (error) {
  //         console.error("Error fetching documents:", error);
  //         // Optionally add error handling UI feedback here
  //       } finally {
  //         setDocLoading(false);
  //       }
  //     };
  //     getDocs();
  //   }
  // }, [caseData]);

  const getMDocs = () => documents.filter((doc) => doc.type === DocType.MAIN);
  const [citationLoading, setCitationLoading] = useState(false);

  useEffect(() => {
    if (documentData) {
      setDocuments(documentData.items as IDocument[]);
    }
  }, [documentData]);

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
    if (docLoading || citationLoading) {
      return;
    }
    let filteredDocs = documents.filter((doc) => doc.type === DocType.MAIN);

    // Search filter
    if (searchKey) {
      const searchLower = searchKey.toLowerCase();
      filteredDocs = filteredDocs.filter(
        (doc: any) =>
          doc.title.toLowerCase().includes(searchLower) ||
          doc.caseTitle?.toLowerCase().includes(searchLower)
      );
    }

    // Enrich documents with additional data
    const enrichedDocs = filteredDocs.map((doc) => ({
      key: doc.id,
      ...doc,
      noExhibits: documents.filter((d) => d.mainDocumentId === doc.id).length,
      exhibits: documents.filter((d) => d.mainDocumentId === doc.id),
    }));

    setMainDocuments(
      enrichedDocs.map((m) => ({
        ...m,
        key: m.id,
        citedInMainDocuments: getCitedInMainDocuments(m.id),
        exhibits: documents
          .filter((d) => d.mainDocumentId === m.id)
          .map((exh) => ({
            ...exh,
            key: exh.id,
            citedInMainDocuments: getCitedInMainDocuments(exh.id),
          })),
      }))
    );
  }, [documents, searchKey, docLoading, citationLoading]);

  useEffect(() => {
    if (mainDocuments.length == 0) return;
    if (documentId) {
      setExpandedMainDocs([documentId]);
    } else {
      setExpandedMainDocs([mainDocuments[0].id]);
      setSelDoc(mainDocuments[0].exhibits[0]);
    }
  }, [documentId, mainDocuments]);

  useEffect(() => {
    if (selDoc) {
      console.log(selDoc.mediaUrl);
    }
  }, [selDoc]);

  // useEffect(() => {
  //   if (
  //     !documents ||
  //     !citations ||
  //     caseLoading ||
  //     citationLoading ||
  //     docLoading
  //   )
  //     return;
  //   setTableCases(
  //     cases
  //       .filter((c) => c.title.toLowerCase().includes(searchKey.toLowerCase()))
  //       .map((c) => ({
  //         key: c.id,
  //         main: documents
  //           .filter((d) => d.caseId === c.id && d.type === DocType.MAIN)
  //           .map((m) => ({
  //             ...m,
  //             key: m.id,
  //             exhibits: documents
  //               .filter((d) => d.caseId === c.id && d.type === DocType.EXHIBIT)
  //               .map((exh) => ({
  //                 ...exh,
  //                 key: exh.id,
  //                 citedInMainDocuments: getCitedInMainDocuments(exh.id),
  //               })),
  //           })),
  //         ...c,
  //       }))
  //   );
  // }, [
  //   cases,
  //   documents,
  //   searchKey,
  //   citations,
  //   caseLoading,
  //   citationLoading,
  //   docLoading,
  // ]);

  const getMainDocColumns = (): TableColumnType<any>[] => [
    {
      title: "#",
      dataIndex: "",
      key: "index",
      width: "5%",
      render: (_, __, index) => <div className="">{index + 1}</div>,
    },
    {
      title: "Main Document",
      dataIndex: "title",
      key: "title",
      width: "25%",
      render: (title: string, record: any) => (
        <div
          className={`border-l-4 pl-2 py-2 ${
            selDoc?.id === record.id ? "border-l-[#056cf3]" : ""
          }`}
        >
          <Link
            href={`/documents?caseId=${record.caseId}&documentId=${record.id}`}
            className={`underline text-[#056cf3] break-all  `}
          >
            {title}
          </Link>
        </div>
      ),
    },
    {
      title: "No. Exhibits",
      dataIndex: "noExhibits",
      key: "noExhibits",
      width: "10%",
      render: (_, record) => <div>{record.exhibits.length}</div>,
    },
    {
      title: "Cited in - As",
      dataIndex: "citedInMainDocuments",
      key: "citedInMainDocuments",
      render: (citedInMainDocuments: any[]) => {
        return (
          <>
            <CitationsList citations={citedInMainDocuments} />
          </>
        );
      },
    },
    {
      title: "Citations",
      dataIndex: "citationsCount",
      key: "citationsCount",
      width: "10%",
    },
  ];

  const getExhibitsColumns = (): TableColumnType<any>[] => [
    {
      title: "#",
      dataIndex: "",
      key: "index",
      width: "5%",
      render: (_, __, index) => <div className="pb-9">{index + 1}</div>,
    },
    {
      title: "Exhibit Name-Description",
      dataIndex: "title",
      key: "title",
      width: "35%",
      render: (title: string, record: any) => (
        <div
          className={`text-xs border-l-4 pl-2 ${
            selDoc?.id === record.id ? "border-l-[#056cf3]" : ""
          }`}
        >
          <div className="underline text-[#056cf3]">{title}</div>
          <div className="text-[#989898] line-clamp-2 text-xs mt-1 break-all">
            Document summary is being generated...
          </div>
        </div>
      ),
    },
    {
      title: "Cited in - As",
      dataIndex: "citedInMainDocuments",
      key: "citedInMainDocuments",
      render: (citedInMainDocuments: any[]) => (
        <CitationsList citations={citedInMainDocuments} />
      ),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      render: (_, record) => (
        <div
          className="hover:text-[#056cf3] cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails(record);
          }}
        >
          <IconEye size={18} />
        </div>
      ),
    },
  ];
  return (
    <BaseLayout>
      <LoadingOverlay
        visible={caseLoading || citationLoading}
        zIndex={1000}
        loaderProps={{ color: "black", type: "bars" }}
      />

      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between">
          <div>
            <div className="text-lg text-[#292929]">
              {matter && (
                <>
                  <span className="text-xl font-semibold mr-2">
                    {matter?.title}/
                  </span>
                </>
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
            mainDocuments={mainDocuments}
          />
        </div>

        {/* Search Bar */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search"
              leftSection={<IconSearch size={18} color="#adb5bd" />}
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              styles={{
                input: {
                  backgroundColor: "#fff",
                  border: "none",
                  borderRadius: "6px",
                },
              }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 mt-6 gap-4 flex-1">
          <div
            className={`bg-white rounded-xl pb-10 ${
              documents.length > 0 ? "col-span-2" : "col-span-3"
            }`}
          >
            {/* <MyTable
              columns={getMainColumns()}
              dataSource={tableCases}
              pagination={false}
              expandable={{
                expandedRowKeys: expandedCases,
                onExpand: (expanded: boolean, record: any) => {
                  setExpandedCases(
                    expanded
                      ? [...expandedCases, record.key]
                      : expandedCases.filter((key) => key !== record.key)
                  );
                },
                expandedRowRender: (record: any) => (
                  <div className="ml-10 my-1 border rounded-lg bg-white pb-4 shadow-sm">
                    <MyTable
                      columns={getMainDocColumns()}
                      dataSource={record.main}
                      pagination={false}
                      expandable={{
                        expandedRowKeys: expandedMainDocs,
                        onExpand: (expanded: boolean, record: any) => {
                          setExpandedMainDocs(
                            expanded
                              ? [...expandedMainDocs, record.key]
                              : expandedMainDocs.filter(
                                  (key) => key !== record.key
                                )
                          );
                        },
                        expandedRowRender: (record: any) => (
                          <div className="ml-10 my-1 border rounded-lg bg-white pb-4">
                            <MyTable
                              columns={getExhibitsColumns()}
                              dataSource={record.exhibits}
                              pagination={false}
                              onRow={(record: any) => ({
                                onClick: () => handleExhibitClick(record),
                              })}
                            />
                          </div>
                        ),
                      }}
                    />
                  </div>
                ),
              }}
            /> */}
            <MyTable
              columns={getMainDocColumns()}
              dataSource={mainDocuments}
              pagination={false}
              onRow={(record: any) => ({
                onClick: () => handleDocumentClick(record),
              })}
              expandable={{
                expandedRowKeys: expandedMainDocs,
                onExpand: (expanded: boolean, record: any) => {
                  setExpandedMainDocs(
                    expanded
                      ? [...expandedMainDocs, record.key]
                      : expandedMainDocs.filter((key) => key !== record.key)
                  );
                },
                expandedRowRender: (record: any) => (
                  <div className="ml-10 my-1 border rounded-lg bg-white pb-4">
                    <MyTable
                      columns={getExhibitsColumns()}
                      dataSource={record.exhibits}
                      pagination={false}
                      onRow={(record: any) => ({
                        onClick: () => handleDocumentClick(record),
                      })}
                    />
                  </div>
                ),
              }}
            />
          </div>

          {/* Preview Panel */}
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
              <PdfViewer mediaUrl={selDoc?.mediaUrl} />
            )}
          </div>
        </div>
      </div>

      <ExhibitDetailDrawer
        cases={[matter]}
        opened={drawerOpened}
        close={closeDrawer}
        selExh={selExh}
      />
    </BaseLayout>
  );
}
