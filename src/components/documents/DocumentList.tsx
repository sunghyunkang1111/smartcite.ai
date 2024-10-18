import React, { useState } from "react"; // Import React
import { Button, Center, CloseButton, Input, Table, Text } from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone"; // Import Dropzone
import { IconPaperclip, IconDownload } from "@tabler/icons-react";
import { getMediaPresignedUrl, uploadFile } from "@services/admin-file-upload.service";
import { createDocument } from "@services/document.service";
import { useCreate, useDelete } from "@refinedev/core";
import { useForm } from "@mantine/form";
import Link from "next/link";
import { getDateStringFromTimestamp } from "@utils/util.functions";
import { DocumentResponseDto } from "../../types/types";

interface DocumentListProps {
    documents: DocumentResponseDto[];
    handleSelectRow?: (documentId: string) => void;
    relatedMainDocumentId: string;
    caseId: string;
    dockType: string;
    selectedMainDocumentId?: string;
    setDocuments: (docs: DocumentResponseDto[]) => void
    refetchDocument: () => void
}

interface FormValues {
    files: File[];
}

const DocumentList: React.FC<DocumentListProps> = ({
    documents,
    handleSelectRow,
    relatedMainDocumentId,
    caseId,
    dockType,
    setDocuments,
    refetchDocument,
    selectedMainDocumentId
}) => {
    const { mutate: deleteMutate } = useDelete();
    const { mutate: createMutate } = useCreate();
    const [files, setFiles] = useState<File[] | null>(null);
    const form = useForm<FormValues>({
        mode: "uncontrolled",
        initialValues: { files: [] },
    });
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
                    file.name,
                    dockType,
                    relatedMainDocumentId
                );
                newDocuments.push(createdDocument);
                setDocuments([...documents, ...newDocuments]);
            } catch (error: any) {
                alert("Failed to upload file: " + error.message);
            }
            setFiles(null);
        }
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
                onSuccess: (res) => refetchDocument()
            }
        );
    };
    const handleDeleteDocument = async (documentId: string) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this document?"
        );
        if (!confirmDelete) {
            return;
        }
        deleteMutate(
            {
                resource: `documents`,
                id: documentId,
            },
            {
                onError: (error) => console.log(error),
                onSuccess: () => setDocuments(documents.filter((doc) => doc.id !== documentId)),
            }
        );
    };

    const handleFileChange = (fs: File[]) => {
        setFiles((prevFiles) => (prevFiles ? [...prevFiles, fs[0]] : fs));
    };

    const selectedFiles = files?.map((file, index) => (
        <div className="border p-2 my-2 rounded-md flex items-center" key={index}>
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

    return (
        <div className="">
            <div className="text-sm mt-5">{dockType} documents</div>
            <div className="border border-dashed border-black">
                <Dropzone
                    h={120}
                    p={0}
                    multiple
                    accept={[MIME_TYPES.png, MIME_TYPES.jpeg, MIME_TYPES.svg]}
                    onDrop={(files) => handleFileChange(files)} // Ensure handleFileChange is passed as a prop
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
                <Button variant="light" onClick={uploadDocuments}>
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
                            <Table.Th>Citations</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {documents
                            ?.filter((doc) => doc.mainDocumentId === relatedMainDocumentId)
                            .map((d: DocumentResponseDto) => (
                                <Table.Tr
                                    key={d.id}
                                    onClick={() => handleSelectRow?.(d.id)}
                                    style={{
                                        cursor: "pointer",
                                        backgroundColor:
                                            selectedMainDocumentId === d.id
                                                ? "#eeeeef"
                                                : "transparent",
                                    }}
                                >
                                    <Table.Td>
                                        <a href={d.mediaUrl} download target="_blank">
                                            <IconDownload size={16} color="#3d3ef1" />
                                        </a>
                                    </Table.Td>
                                    <Table.Td>{d.title}</Table.Td>
                                    <Table.Td>{d.processingStatus}</Table.Td>
                                    <Table.Td>{d.citationsExtractionStatus}</Table.Td>
                                    <Table.Td>
                                        <Link
                                            href={`/citations?documentId=${d.id}&caseId=${caseId}`}
                                            className="text-[#99a9ee] hover:underline cursor-pointer"
                                        >
                                            View {d.citationsCount} citation(s)
                                        </Link>
                                    </Table.Td>
                                    <Table.Td>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="xs"
                                                onClick={() => handleExtractCitations(d.id)}
                                            >
                                                Extract Citations
                                            </Button>
                                            <Button
                                                variant="outline"
                                                color="red.9"
                                                size="xs"
                                                onClick={() => handleDeleteDocument(d.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        }
                    </Table.Tbody>
                </Table>
            </div>
        </div>
    );
};

export default DocumentList;