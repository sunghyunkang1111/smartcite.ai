"use client";

import React, { useEffect, useState } from "react";
import { Input, LoadingOverlay } from "@mantine/core";
import { DatePicker, notification } from "antd";
import type { TableColumnType } from "antd";
import { useDelete, useNavigation, useOne, useTable } from "@refinedev/core";
import dayjs from "dayjs";
import { Layout as BaseLayout } from "@/components/layout";
import DeleteConfirmModal from "@/components/common/DeleteBtnWithConfirmModal";
import { IconDownload, IconSearch, IconTrash } from "@tabler/icons-react";
import { ICase, IDocument } from "@/types/types";
import { getFormatedDate } from "@/utils/util.functions";
import { DocType } from "@/utils/util.constants";
import MyTable from "@/components/common/MyTable";
import { useDisclosure } from "@mantine/hooks";
import DocumentDetailDrawer from "@/components/documents/DocumentDetailDrawer";
import AddExhibit from "@/components/documents/AddExhibit";
import AddDocument from "@/components/documents/AddDocument";
import { useSearchParams } from "next/navigation";
import Link from "antd/es/typography/Link";

const { RangePicker } = DatePicker;

export default function DocumentList() {
  // State
  const { push } = useNavigation();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");
  const caseId = searchParams.get("caseId");
  const [searchKey, setSearchKey] = useState("");
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [mainDocuments, setMainDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selMDoc, setSelMDoc] = useState<any>();
  const [dateRange, setDateRange] = useState<[any, any] | null>([
    dayjs().subtract(6, "month"),
    dayjs(),
  ]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  // Hooks
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const { mutate: deleteMutate } = useDelete();

  // const { data: caseData, isLoading: caseLoading } = useTable<any>({
  //   resource: "cases",
  //   syncWithLocation: false,
  // }).tableQueryResult;

  const { data: caseData, isLoading: caseLoading } = useOne<ICase>({
    resource: "cases",
    id: caseId || "",
  });

  const matter = caseData?.data;

  const {
    data: documentData,
    isLoading: docLoading,
  } = useTable<any>({
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
    if (!caseId) {
      push(`/cases`);
    }
  }, [caseId]);

  useEffect(() => {
    if (documentData) {
      setDocuments(documentData.items as IDocument[]);
    }
  }, [documentData]);
  // useEffect(() => {
  //   if (caseData) {
  //     setCases(caseData.items as ICase[]);
  //     const getDocs = async () => {
  //       setDocLoading(true);
  //       try {
  //         for (const c of caseData.items) {
  //           const docsData = (await getDocumentsByCaseId(c.id)) as any;
  //           const docs = docsData?.items || [];
  //           docs.forEach((doc: any) => {
  //             if (!documents.find((d) => d.id === doc.id)) {
  //               setDocuments((prev) => [...prev, doc]);
  //             }
  //           });
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

  // Handlers
  const handleDeleteDocument = async (doc: IDocument) => {
    setLoading(true);
    deleteMutate(
      {
        resource: `documents`,
        id: doc.id,
      },
      {
        onError: () => {
          setLoading(false);
          notification.error({
            message: "Error",
            description: "Failed to delete document. Please try again later.",
          });
        },
        onSuccess: () => {
          setDocuments(documents.filter((d) => d.id !== doc.id));
          notification.success({
            message: "Success",
            description: "Document deleted successfully.",
          });
          setLoading(false);
        },
      }
    );
  };

  const handleRowClick = (record: any) => {
    openDrawer();
    setSelMDoc(record);
  };

  // Table Columns
  const mainColumns: TableColumnType<any>[] = [
    {
      title: "Document Name",
      dataIndex: "title",
      key: "title",
      sorter: (a: any, b: any) => a.title.localeCompare(b.title),
      sortDirections: ["ascend", "descend"],
      render: (title: string) => (
        <div className="underline text-[#056cf3]">{title}</div>
      ),
    },
    {
      title: "No.Exhibits",
      dataIndex: "noExhibits",
      key: "noExhibits",
      sorter: (a: any, b: any) => a.noExhibits - b.noExhibits,
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Uploaded At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) => getFormatedDate(createdAt),
      sorter: (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Action",
      dataIndex: "",
      key: "action",
      render: (_, record) => (
        <div
          className="flex gap-2 items-center text-[#c5c5c5]"
          onClick={(e) => e.stopPropagation()}
        >
          <AddExhibit document={record} setDocuments={setDocuments} />
          <a
            href={record.mediaUrl}
            download
            target="_blank"
            className="cursor-pointer hover:text-[#2e2e2e] text-[#c5c5c5]"
          >
            <IconDownload size={18} />
          </a>
          <DeleteConfirmModal
            onDelete={() => handleDeleteDocument(record)}
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

  const exhibitsColumns: TableColumnType<any>[] = [
    {
      title: "#",
      dataIndex: "",
      key: "index",
      render: (_, __, index) => <div className="">{index + 1}</div>,
    },
    {
      title: "Exhibit Name",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: any) => (
        <>
          <Link
            href={`/exhibits?caseId=${record.caseId}&documentId=${record.mainDocumentId}&exhibitId=${record.id}`}
            className="!underline text-[#056cf3]"
          >
            {title}
          </Link>
        </>
      ),
    },
    {
      title: "Action",
      dataIndex: "",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2 items-center text-[#c5c5c5]">
          <a
            href={record.mediaUrl}
            download
            target="_blank"
            className="cursor-pointer hover:text-[#2e2e2e] text-[#c5c5c5]"
          >
            <IconDownload size={18} />
          </a>
          <DeleteConfirmModal
            onDelete={() => handleDeleteDocument(record)}
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

  useEffect(() => {
    let filteredDocs = documents.filter((doc) => doc.type === DocType.MAIN);

    // Date range filter
    // if (dateRange?.[0] && dateRange?.[1]) {
    //   filteredDocs = filteredDocs.filter((doc) => {
    //     const docDate = dayjs(doc.createdAt);
    //     return (
    //       docDate.isAfter(dateRange[0]) &&
    //       docDate.isBefore(dateRange[1].add(1, "day"))
    //     );
    //   });
    // }

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

    setMainDocuments(enrichedDocs);
  }, [documents, dateRange, searchKey]);

  useEffect(() => {
    if (mainDocuments.length == 0) return;
    console.log(mainDocuments);
    if (documentId) {
      setExpandedRowKeys([documentId]);
    } else {
      setExpandedRowKeys([mainDocuments[0].id]);
    }
  }, [documentId, mainDocuments]);

  return (
    <BaseLayout>
      <LoadingOverlay
        visible={loading || docLoading || caseLoading}
        zIndex={1000}
        loaderProps={{ color: "black", type: "bars" }}
      />
      <div className="p-6">
        <div className="flex justify-between">
          <div>
            <div className="text-lg text-[#292929]">
              {matter && (
                <>
                  <span className="text-xl font-semibold mr-2">
                    {matter?.title}
                  </span>
                  /
                </>
              )}
              Documents
            </div>
            <div className="text-[#7c7c7c] py-2">
              Manage all your matter-related documents in one place
            </div>
          </div>
          <div>
            <AddDocument
              cases={[matter as ICase]}
              setDocuments={setDocuments}
            />
          </div>
        </div>

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
            {/* <RangePicker
              style={{
                border: "none",
                backgroundColor: "#fff",
                borderRadius: "6px",
              }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
            /> */}
          </div>
        </div>

        <div className="mt-6 text-xs bg-white rounded-xl pb-10">
          <MyTable
            columns={mainColumns}
            dataSource={mainDocuments}
            pagination={false}
            expandable={{
              expandedRowRender: (record: any) => (
                <div className="ml-10 my-4 border rounded-lg bg-white pb-4">
                  <MyTable
                    columns={exhibitsColumns}
                    dataSource={record.exhibits}
                    pagination={false}
                  />
                </div>
              ),
              expandedRowKeys: expandedRowKeys,
              onExpandedRowsChange: (newExpandedRows: React.Key[]) => {
                setExpandedRowKeys(newExpandedRows);
              },
            }}
            onRow={(record: any) => ({
              onClick: () => handleRowClick(record),
            })}
          />
        </div>
      </div>

      <DocumentDetailDrawer
        opened={drawerOpened}
        caseTitle={matter?.title || ""}
        close={closeDrawer}
        selMDoc={selMDoc}
        setSelMDoc={setSelMDoc}
        setMainDocuments={setMainDocuments}
      />
    </BaseLayout>
  );
}
