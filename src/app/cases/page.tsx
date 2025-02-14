"use client";

import React, { useEffect, useState } from "react";
import { Button, Input, LoadingOverlay } from "@mantine/core";
import { DatePicker, notification, Table } from "antd";
import type { TableColumnType } from "antd";
import { useDelete, useTable } from "@refinedev/core";
import Link from "next/link";
import dayjs from "dayjs";
import { Layout as BaseLayout } from "@/components/layout";
import DeleteConfirmModal from "@/components/common/DeleteBtnWithConfirmModal";
import { IconEdit, IconSearch, IconTrash } from "@tabler/icons-react";
import { ICase } from "@/types/types";
import { getFormatedDate } from "@/utils/util.functions";
import { getAllUsers } from "@/services/keycloak/user.service";
const { RangePicker } = DatePicker;
export default function BlogPostList() {
  const { mutate: deleteMutate } = useDelete();
  const [searchKey, setSearchKey] = useState("");
  const [caseState, setCaseState] = useState("View All");
  const [userLoading, setUserLoading] = useState<boolean>(false);
  const {
    tableQuery: { data: caseData, isLoading: caseLoading },
  } = useTable<any>({
    syncWithLocation: false,
  });

  const [cases, setCases] = useState<ICase[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading2, setLoading2] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<[any, any] | null>([
    dayjs().subtract(6, "month"),
    dayjs(),
  ]);

  const columns: TableColumnType<ICase>[] = [
    {
      title: "#",
      dataIndex: "",
      key: "index",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      sorter: (a: ICase, b: ICase) => a.title.localeCompare(b.title),
      sortDirections: ["ascend", "descend"],
      render: (title: string, record: ICase) => (
        <Link
          href={`/cases/edit?caseId=${record.id}`}
          className="underline text-[#056cf3]"
        >
          {title || "N/A"}
        </Link>
      ),
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      filters: [
        {
          text: "Petitioner",
          value: "Petitioner",
        },
        {
          text: "Respondent",
          value: "Respondent",
        },
      ],
      onFilter: (value, record) => record.clientRole === value,
      render: (_: any, record: ICase) => (
        <>
          <div className="text-sm text-black">
            {record.client == " " ? "N/A" : record.client}
          </div>
          <div className="text-[#989898] text-xs mt-1">
            {record.clientRole == " " ? "N/A" : record.clientRole}
          </div>
        </>
      ),
    },
    // {
    //   title: "Status",
    //   dataIndex: "state",
    //   key: "state",
    //   render: (value: string) => (
    //     <span
    //       style={{
    //         backgroundColor:
    //           CaseStateBgColor[value as keyof typeof CaseStateBgColor],
    //         color: CaseStateTextColor[value as keyof typeof CaseStateTextColor],
    //       }}
    //       className="px-2 py-1 rounded-md font-semibold"
    //     >
    //       {value == " " ? "N/A" : value}
    //     </span>
    //   ),
    // },
    {
      title: "No.Documents",
      dataIndex: "uploadedDocumentsCount",
      key: "uploadedDocumentsCount",
      sorter: (a: ICase, b: ICase) =>
        a.uploadedDocumentsCount - b.uploadedDocumentsCount,
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Assigned Lawyers",
      dataIndex: "assignedLawyers",
      key: "assignedLawyers",
      filters: users.map((user) => ({
        text: user.firstName + " " + user.lastName,
        value: user.id,
      })),
      onFilter: (value, record) =>
        record.assignedLawyers.includes(value as string),
      render: (value) => {
        return (
          value
            .split(",")
            .map((id: string) => {
              const user = users.find((user) => user.id === id);
              return user ? user.firstName + " " + user.lastName : null;
            })
            .join(", ") || "N/A"
        );
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) => getFormatedDate(createdAt),
      sorter: (a: ICase, b: ICase) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Action",
      dataIndex: "",
      key: "action",
      render: (value, record) => (
        <div className="flex gap-2 items-center text-[#c5c5c5]">
          <Link
            href={`/cases/edit?caseId=${record.id}`}
            className="cursor-pointer"
          >
            <IconEdit
              size={18}
              className="hover:text-[#2e2e2e] text-[#c5c5c5]"
            />
          </Link>
          <DeleteConfirmModal
            onDelete={() => handleDelete(record.id)}
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
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await getAllUsers(token as string);
        setUsers(response);
        setUserLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUserLoading(false);
      }
    };
    console.log("feching Users", users);
    setUserLoading(true);
    fetchUsers();
  }, []);

  useEffect(() => {
    console.log("fetching caseData");
    if (caseData) {
      const cases = caseData.items as ICase[];
      let filteredCases = cases;

      // Filter by date range if it exists
      if (dateRange && dateRange[0] && dateRange[1]) {
        filteredCases = cases.filter((c) => {
          const caseDate = dayjs(c.createdAt);
          return (
            caseDate.isAfter(dateRange[0]) && caseDate.isBefore(dateRange[1])
          );
        });
      }

      // Filter by case state if not "View All"
      if (caseState !== "View All") {
        filteredCases = filteredCases.filter((c) => c.state === caseState);
      }

      // Filter by search key if it exists
      if (searchKey) {
        filteredCases = filteredCases.filter((c) =>
          c.title.toLowerCase().includes(searchKey.toLowerCase())
        );
      }

      setCases(filteredCases);
    }
  }, [caseData, caseState, dateRange, searchKey]);
  const handleDelete = async (caseId: string) => {
    setLoading2(true);
    deleteMutate(
      {
        resource: `cases`,
        id: caseId,
      },
      {
        onError: () => {
          setLoading2(false);
          notification.error({
            message: "Error",
            description: "Failed to delete case",
          });
        },
        onSuccess: () => {
          setLoading2(false);
          notification.success({
            message: "Success",
            description: "Case deleted successfully",
          });
        },
      }
    );
    const updatedCases = cases.filter((c) => c.id !== caseId);
    setCases(updatedCases);
  };

  return (
    <BaseLayout>
      <LoadingOverlay
        visible={caseLoading || loading2 || userLoading}
        zIndex={1000}
        loaderProps={{ color: "black", type: "bars" }}
      />
      <div className="p-6">
        <div className="flex justify-between">
          <div>
            <div className="text-xl text-[#292929] font-semibold">
              Matters
            </div>
            {/* <div className="text-[#7c7c7c] py-2">
              Quickly access case info and documents
            </div> */}
          </div>
          <div className="">
            <Button
              variant=""
              color="dark.6"
              type="submit"
              component="a"
              href="/cases/create"
            >
              + Add matter
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          {/* <div className="flex gap-2 bg-white px-2.5 py-2 rounded-lg">
            {["View All", ...CaseStates].map((state) => (
              <div
                onClick={() => setCaseState(state)}
                key={state}
                className={`px-3 py-1  cursor-pointer hover:bg-[#f4f4f4] text-sm ${
                  state === caseState
                    ? "bg-[#f4f4f4] text-[#353535]"
                    : "text-[#989898]"
                } rounded-md`}
              >
                {state}
              </div>
            ))}
          </div> */}
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
            <RangePicker
              style={{
                border: "none",
                backgroundColor: "#fff",
                borderRadius: "6px",
              }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
            />
          </div>
        </div>
        <div className="mt-6 text-xs bg-white rounded-xl">
          <Table<ICase>
            columns={columns}
            dataSource={cases}
            components={{
              header: {
                cell: (props: any) => (
                  <th
                    {...props}
                    style={{
                      color: "#989898", // Optional
                      padding: "12px 16px", // Adjust these values as needed
                      fontWeight: "semibold",
                    }}
                  />
                ),
              },
              body: {
                cell: (props: any) => (
                  <td
                    {...props}
                    style={{
                      padding: "6px 16px", // Adjust these values as needed
                      color: "#7c7c7c",
                    }}
                  />
                ),
              },
            }}
          />
        </div>
      </div>
    </BaseLayout>
  );
}
