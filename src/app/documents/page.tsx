"use client";

import React, { useEffect, useState } from "react";
import { Button, Center, CloseButton, Input, Table, Text } from "@mantine/core";
import {
  useCreate,
  useDelete,
  useList,
  useNavigation,
  useOne,
  useParsed,
  useTable,
} from "@refinedev/core";
import Link from "next/link";
import { IconPaperclip, IconDownload } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import {
  getMediaPresignedUrl,
  uploadFile,
} from "@services/admin-file-upload.service";
import { createDocument } from "@services/document.service";

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

interface FormValues {
  files: File[];
}
export default function BlogPostList() {
  const { mutate: deleteMutate } = useDelete();
  const { mutate: createMutate } = useCreate();
  const { push } = useNavigation();
  const { params } = useParsed();
  const caseId = params?.caseId;
  const [documents, setDocuments] = useState<DocumentResponseDto[]>([]);
  const [files, setFiles] = useState<File[] | null>(null);
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

  const form = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: { files: [] },
  });
  const getDateStringFromTimestamp = (ts: number) => {
    const date = new Date(ts);

    // Format the date to the desired string format
    const options = {
      year: "numeric" as const,
      month: "numeric" as const,
      day: "numeric" as const,
      hour: "numeric" as const,
      minute: "numeric" as const,
      second: "numeric" as const,
      hour12: true,
    };

    const formattedDate = date.toLocaleString("en-US", options);
    return formattedDate;
  };
  const selectedFiles = files?.map((file, index) => (
    <div className="border p-2 my-2 rounded-md flex items-center">
      <div className="p-4 pr-4">
        <IconPaperclip size={16} color="black" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium p-0.5">{file.name}</div>
        <div className="text-xs font-medium p-0.5">
          {getDateStringFromTimestamp(file.lastModified)}
        </div>
      </div>
      <div className="p-2">
        <CloseButton
          size="sm"
          onClick={() => setFiles(files.filter((_, i) => i !== index))}
        />
      </div>
    </div>
  ));

  const handleFileChange = (fs: File[]) => {
    setFiles((prevFiles) => (prevFiles ? [...prevFiles, fs[0]] : fs));
  };

  const uploadDocuments = async () => {
    if (!files) {
      alert("Please select a file to upload.");
      return;
    }
    const newDocuments: DocumentResponseDto[] = [];
    for (const file of files as File[]) {
      try {
        const presignedUrl = await getMediaPresignedUrl();
        await uploadFile(file, presignedUrl.uploadUrl);
        const createdDocument = await createDocument(
          caseId,
          presignedUrl.id,
          file.name
        );
        newDocuments.push(createdDocument);
        setDocuments([...documents, ...newDocuments]);
      } catch (error: any) {
        alert("Failed to upload file: " + error.message);
      }
      setFiles(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this document?"
    );
    if (!confirmDelete) {
      return;
    }
    // await endpoints.adminDocuments.deleteDocument(accessToken, documentId);
    deleteMutate(
      {
        resource: `documents`,
        id: documentId,
      },
      {
        onError: (error) => console.log(error),
        onSuccess: () => {
          setDocuments(documents.filter((doc) => doc.id !== documentId));
        },
      }
    );
  };

  const handleExtractCitations = async (documentId: string) => {
    const document = documents.find((doc) => doc.id === documentId);
    const confirmExtract = window.confirm(
      `Are you sure you want to begin citation extraction for document "${document?.title}"?`
    );
    if (!confirmExtract) {
      return;
    }

    createMutate(
      {
        resource: `documents/${documentId}/extract-citations`,
        values: {},
      },
      {
        onError: (error) => console.log(error),
        onSuccess: () => refetchDocuments(),
      }
    );
  };

  useEffect(() => {
    const d = documentData?.data as any;
    if (d) {
      setDocuments(d?.items as DocumentResponseDto[]);
    }
  }, [documentData]);

  return (
    <div className="p-5">
      <Link href={"/cases"} className="text-[#551a8b] underline text-sm">
        &lt; All cases
      </Link>
      <div className="text-sm mt-5">Case {caseData?.data.title}</div>
      <div className="text-sm mt-5">Upload new documents</div>
      <div className="border border-dashed border-black">
        <Dropzone
          h={120}
          p={0}
          multiple
          accept={[MIME_TYPES.png, MIME_TYPES.jpeg, MIME_TYPES.svg]}
          onDrop={(files) => handleFileChange(files)}
          onReject={() => form.setFieldError("files", "Select images only")}
        >
          <Center h={120}>
            <Dropzone.Idle>Drop files here</Dropzone.Idle>
            <Dropzone.Accept>Drop files here</Dropzone.Accept>
            <Dropzone.Reject>Files are invalid</Dropzone.Reject>
          </Center>
        </Dropzone>
      </div>
      {form.errors.files && (
        <Text c="red" mt={5}>
          {form.errors.files}
        </Text>
      )}

      {files && selectedFiles}
      <div className="text-center p-2">
        <Button variant="light" onClick={() => uploadDocuments()}>
          Upload documents
        </Button>
      </div>
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
              <Table.Th>Title</Table.Th>
              <Table.Th>Processing status</Table.Th>
              <Table.Th>Citations extraction status</Table.Th>
              <Table.Th>Uploaded at</Table.Th>
              <Table.Th>Citations count</Table.Th>
              <Table.Th>Citations</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {documents?.map((d: DocumentResponseDto) => (
              <Table.Tr>
                <Table.Td>
                  <a href={d.mediaUrl} download target="_blank">
                    <IconDownload size={16} color="#3d3ef1" />
                  </a>
                </Table.Td>
                <Table.Td>{d.title}</Table.Td>
                <Table.Td>{d.processingStatus}</Table.Td>
                <Table.Td>{d.citationsExtractionStatus}</Table.Td>
                <Table.Td>
                  {new Date(d.createdAt).toLocaleDateString()}
                </Table.Td>
                <Table.Td>{d.citationsCount}</Table.Td>
                <Table.Td>
                  <Link
                    href={`/admin/pages/citations?documentId=${d.id}&caseId=${caseId}`}
                    className="text-[#99a9ee] hover:underline cursor-pointer"
                  >
                    View {d.citationsCount} citation(s)
                  </Link>
                </Table.Td>
                <Table.Td>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleExtractCitations(d.id)}
                  >
                    Extract Citations
                  </Button>
                </Table.Td>
                <Table.Td>
                  <Button
                    variant="outline"
                    color="red.9"
                    size="xs"
                    onClick={() => handleDeleteDocument(d.id)}
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
