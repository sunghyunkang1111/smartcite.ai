import React, { useEffect, useState } from "react"; // Import React
import {
  Button,
  Center,
  CloseButton,
  Group,
  Input,
  LoadingOverlay,
  Menu,
  Progress,
  rem,
  Table,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone"; // Import Dropzone
import {
  IconPaperclip,
  IconDownload,
  IconX,
  IconCloudUpload,
  IconTrash,
  IconLayersSubtract,
  IconBaselineDensityMedium,
  IconBaselineDensitySmall,
  IconEye,
  IconEyeDown,
  IconCircleMinus,
} from "@tabler/icons-react";
import {
  getMediaPresignedUrl,
  uploadFile,
} from "@services/admin-file-upload.service";
import { createDocument } from "@services/document.service";
import { useCreate, useDelete, useNavigation } from "@refinedev/core";
import { useForm } from "@mantine/form";
import Link from "next/link";
import {
  formatFileSize,
  getDateStringFromTimestamp,
} from "@utils/util.functions";
import { DocumentResponseDto } from "../../types/types";

interface DocumentListProps {
  documents: DocumentResponseDto[];
  handleSelectRow?: (documentId: string) => void;
  relatedMainDocumentId: string;
  caseId: string;
  dockType: string;
  selectedMainDocumentId?: string;
  setDocuments: (docs: DocumentResponseDto[]) => void;
  refetchDocument: () => void;
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
  selectedMainDocumentId,
}) => {
  const theme = useMantineTheme();
  const { mutate: deleteMutate } = useDelete();
  const { mutate: createMutate } = useCreate();
  const { push } = useNavigation();
  const [cancelControllers, setCancelControllers] = useState<(() => void)[]>(
    []
  );
  const [files, setFiles] = useState<File[] | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<
    { index: number; progress: number; cancel: boolean }[]
  >([]); // Define type for uploadingFiles

  const [loading, setLoading] = useState<boolean>(false);
  const form = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: { files: [] },
  });

  // Function to update the upload progress
  const updateUploadProgress = (index: number, progress: number) => {
    setUploadingFiles((prev) => {
      return prev.map((p) => {
        if (p.index === index) {
          return {
            ...p,
            progress: progress,
          };
        }
        return p;
      });
    });
  };

  const handleExtractCitations = async (documentId: string) => {
    const document = documents.find((doc) => doc.id === documentId);
    const confirmExtract = window.confirm(
      `Are you sure you want to begin citation extraction for document "${document?.title}"?`
    );
    if (!confirmExtract) {
      return;
    }

    setLoading(true);

    createMutate(
      {
        resource: `documents/${documentId}/extract-citations`,
        values: {},
      },
      {
        onError: (error) => console.log(error),
        onSuccess: (res) => {
          setLoading(true);
          refetchDocument();
        },
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
    setLoading(true);
    deleteMutate(
      {
        resource: `documents`,
        id: documentId,
      },
      {
        onError: (error) => console.log(error),
        onSuccess: () => {
          setLoading(false);
          setDocuments(documents.filter((doc) => doc.id !== documentId));
        },
      }
    );
  };

  const handleFileChange = async (fs: File[]) => {
    const newDocuments: DocumentResponseDto[] = [];
    setFiles(fs);
    setUploadingFiles(
      fs.map((_, i) => ({
        index: i,
        progress: 0,
        cancel: false,
      }))
    );

    const uploadPromises = fs.map(async (file, i) => {
      try {
        const presignedUrl = await getMediaPresignedUrl();
        await uploadFile(file, presignedUrl.uploadUrl, (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 99) / (progressEvent.total || 1)
          );
          updateUploadProgress(i, percent);
        });
        const createdDocument = await createDocument(
          caseId,
          presignedUrl.id,
          file.name,
          dockType,
          relatedMainDocumentId
        );
        updateUploadProgress(i, 100);
        newDocuments.push(createdDocument);
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((uf) => uf.index !== i));
        }, 1000);
      } catch (error: any) {
        alert("Failed to upload file: " + error.message);
      }
    });

    await Promise.all(uploadPromises); // Wait for all uploads to complete
    setDocuments([...documents, ...newDocuments]);
    // setLoading(false);
    setCancelControllers(cancelControllers);
  };

  const cancelUpload = (i: number) => {};

  return (
    <div className="relative">
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
        loaderProps={{ color: "teal.8", type: "bars" }}
      />
      <div className="text-sm mt-5">{dockType} documents</div>
      <div className="">
        <Dropzone
          p={0}
          multiple
          radius="xl"
          maxSize={30 * 1024 ** 2}
          onDrop={(files) => handleFileChange(files)} // Ensure handleFileChange is passed as a prop
          onReject={() => form.setFieldError("files", "Select images only")}
        >
          <div className="flex gap-3 justify-center items-center py-4 cursor-pointer hover:bg-[#f0f0f0] border border-[#ced4da] border-dashed rounded-lg">
            <Group justify="center">
              <Dropzone.Accept>
                <IconDownload
                  style={{ width: rem(40), height: rem(40) }}
                  color={theme.colors.blue[6]}
                  stroke={1.5}
                />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX
                  style={{ width: rem(40), height: rem(40) }}
                  color={theme.colors.red[6]}
                  stroke={1.5}
                />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconCloudUpload
                  style={{ width: rem(40), height: rem(40) }}
                  stroke={1.5}
                />
              </Dropzone.Idle>
            </Group>

            <div className="flex items-center justify-center font-semibold mt-1">
              <Dropzone.Accept>Drop files here</Dropzone.Accept>
              <Dropzone.Reject>Pdf file less than 30mb</Dropzone.Reject>
              <Dropzone.Idle>Upload file</Dropzone.Idle>
            </div>
          </div>
        </Dropzone>
      </div>
      <div className="py-4 flex flex-col gap-4">
        {uploadingFiles.map((uf) => (
          <div key={uf.index} className="border p-4 rounded-lg">
            <div className="flex gap-8 items-center">
              <div className="flex flex-col gap-2 flex-1">
                <div className="text-sm font-bold">
                  {files?.[uf.index].name}
                </div>
                <div className="text-xs flex justify-between">
                  <div>{formatFileSize(files?.[uf.index].size as number)}</div>
                  <div className="">{uf.progress}%</div>
                </div>
                <Progress value={uf.progress} animated />
              </div>
              {/* <div>
                <button
                  className="hover:text-black"
                  onClick={() => cancelUpload(uf.index)}
                >
                  <IconCircleMinus
                    style={{ width: rem(25), height: rem(25) }}
                    stroke={1.5}
                  />
                </button>
              </div> */}
            </div>
          </div>
        ))}
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
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Processing status</Table.Th>
              <Table.Th>Citations extraction status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {documents
              ?.filter((doc) => doc.mainDocumentId === relatedMainDocumentId)
              .map((d: DocumentResponseDto) => (
                <Table.Tr key={d.id}>
                  <Table.Td onClick={() => handleSelectRow?.(d.id)}>
                    <div
                      className={`${
                        selectedMainDocumentId === d.id
                          ? "text-[#3040d6]"
                          : "text-[#6e6e6e]"
                      } cursor-pointer font-bold`}
                    >
                      {d.title}
                    </div>
                  </Table.Td>
                  <Table.Td>{d.processingStatus}</Table.Td>
                  <Table.Td>{d.citationsExtractionStatus}</Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <button className="border p-2 rounded-md hover:bg-[#f0f0f0] duration-300">
                          <IconBaselineDensityMedium
                            style={{ width: rem(14), height: rem(14) }}
                          />
                        </button>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={
                            <IconEye
                              style={{ width: rem(14), height: rem(14) }}
                            />
                          }
                          onClick={() =>
                            push(
                              `/documents/detail/?documentId=${d.id}&caseId=${caseId}`
                            )
                          }
                        >
                          View Details
                        </Menu.Item>
                        <Menu.Item
                          leftSection={
                            <IconLayersSubtract
                              style={{ width: rem(14), height: rem(14) }}
                            />
                          }
                          onClick={() => handleExtractCitations(d.id)}
                        >
                          Extract Citations
                        </Menu.Item>
                        <Menu.Item
                          leftSection={
                            <IconEye
                              style={{ width: rem(14), height: rem(14) }}
                            />
                          }
                          onClick={() =>
                            push(
                              `/citations?documentId=${d.id}&caseId=${caseId}`
                            )
                          }
                        >
                          View Citations
                        </Menu.Item>
                        <Menu.Item
                          leftSection={
                            <IconEyeDown
                              style={{ width: rem(14), height: rem(14) }}
                            />
                          }
                          component="a"
                          href={d.mediaUrl}
                          target="_blank"
                        >
                          View File
                        </Menu.Item>
                        <Menu.Item
                          color="red"
                          leftSection={
                            <IconTrash
                              style={{ width: rem(14), height: rem(14) }}
                            />
                          }
                          onClick={() => handleDeleteDocument(d.id)}
                        >
                          Delete my account
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
          </Table.Tbody>
        </Table>
      </div>
    </div>
  );
};

export default DocumentList;
