"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Collapse,
  LoadingOverlay,
  Menu,
  Progress,
  rem,
} from "@mantine/core";
import {
  useCreate,
  useDelete,
  useList,
  useNavigation,
  useOne,
  useParsed,
} from "@refinedev/core";
import Link from "next/link";
import DocumentList from "@components/documents/DocumentList";
import { DocType } from "@utils/util.constants";
import { DocumentResponseDto } from "../../types/types";
import FileUploadDropzone from "@components/documents/FileUploadDropzone";

import { createDocument } from "@services/document.service";
import { formatFileSize } from "@utils/util.functions";
import {
  IconBaselineDensityMedium,
  IconExternalLink,
  IconEye,
  IconEyeDown,
  IconLayersSubtract,
  IconMinus,
  IconPaperclip,
  IconPlus,
  IconScript,
  IconTrash,
} from "@tabler/icons-react";
import {
  getMediaPresignedUrl,
  uploadFile,
} from "@services/admin-file-upload.service";
import ExhibitsPanel from "@components/documents/ExhibitsPanel";
import { useDisclosure } from "@mantine/hooks";

export default function BlogPostList() {
  const { push } = useNavigation();
  const { mutate: deleteMutate } = useDelete();
  const { mutate: createMutate } = useCreate();
  const { params } = useParsed();
  const caseId = params?.caseId;
  const [selectedMainDocumentId, setSelectedMainDocumentId] =
    useState<string>();
  const [files, setFiles] = useState<File[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingFiles, setUploadingFiles] = useState<
    { index: number; progress: number }[]
  >([]); // Define type for uploadingFiles
  const [opened, { toggle }] = useDisclosure(false);

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

  const handleMainFileChange = async (fs: File[]) => {
    const newDocuments: DocumentResponseDto[] = [];
    setFiles(fs);
    setUploadingFiles(
      fs.map((_, i) => ({
        index: i,
        progress: 0,
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
          DocType.MAIN,
          DocType.MAIN
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
          refetchDocuments();
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

  return (
    <div className="p-5 h-full flex flex-col">
      <Link href={"/cases"} className="text-[#551a8b] underline text-sm">
        &lt; All cases
      </Link>
      <div className="text-sm mt-5">Case {caseData?.data.title}</div>
      <div className="flex justify-end">
        <Button
          leftSection={
            opened ? <IconMinus size={14} /> : <IconPlus size={14} />
          }
          variant="default"
          onClick={toggle}
        >
          Add Document
        </Button>
      </div>
      <Collapse in={opened}>
        <div className="py-2">
          <FileUploadDropzone handleFileChange={handleMainFileChange} />
        </div>
      </Collapse>
      <div className="py-2 flex flex-col">
        {uploadingFiles.map((uf) => (
          <div
            key={uf.index}
            className="border p-4 my-2 rounded-lg flex gap-8 items-center"
          >
            <div className="flex flex-col gap-2 flex-1">
              <div className="text-sm font-bold">{files?.[uf.index].name}</div>
              <div className="text-xs flex justify-between">
                <div>{formatFileSize(files?.[uf.index].size as number)}</div>
                <div className="">{uf.progress}%</div>
              </div>
              <Progress value={uf.progress} animated />
            </div>
          </div>
        ))}
      </div>
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
          <LoadingOverlay
            visible={loading}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
            loaderProps={{ color: "pink", type: "bars" }}
          />
          {documents
            .filter((doc) => doc.type === DocType.MAIN)
            .map((doc, _i) => (
              <div
                key={doc.id}
                className={`border border-t-0 p-4 border-r-0 flex justify-between items-center cursor-pointer
                  ${
                    selectedMainDocumentId === doc.id
                      ? "text-[#099268]"
                      : "text-[#6e6e6e]"
                  } 
                  ${_i === 0 ? "border-t" : ""}`}
              >
                <div
                  onClick={() => setSelectedMainDocumentId(doc.id)}
                  className="font-bold flex gap-2 items-center cursor-pointer text-sm"
                >
                  <IconExternalLink
                    style={{ width: rem(20), height: rem(20) }}
                  />
                  {doc.title}
                </div>
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
                        <IconEye style={{ width: rem(14), height: rem(14) }} />
                      }
                      onClick={() =>
                        push(
                          `/documents/detail/?documentId=${doc.id}&caseId=${caseId}`
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
                      onClick={() => handleExtractCitations(doc.id)}
                    >
                      Extract Citations
                    </Menu.Item>
                    <Menu.Item
                      leftSection={
                        <IconEye style={{ width: rem(14), height: rem(14) }} />
                      }
                      onClick={() =>
                        push(`/citations?documentId=${doc.id}&caseId=${caseId}`)
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
                      href={doc.mediaUrl}
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
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      Delete my account
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </div>
            ))}
        </div>
        <div className="border col-span-6 p-4">
          {selectedMainDocumentId && (
            <ExhibitsPanel
              mainDocumentId={selectedMainDocumentId}
              caseId={caseId}
              setDocuments={setDocuments}
              documents={documents}
            />
          )}
        </div>
      </div>
    </div>
  );
}
