import { Dropzone } from "@mantine/dropzone";
import React, { useEffect, useState } from "react"; // Import React
import { useForm } from "@mantine/form";
import { Group, LoadingOverlay, Progress, rem, useMantineTheme } from "@mantine/core";
import {
  IconCloudUpload,
  IconDownload,
  IconPaperclip,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import FileUploadDropzone from "./FileUploadDropzone";
import { DocumentResponseDto } from "@/types/types";
import {
  getMediaPresignedUrl,
  uploadFile,
} from "@services/admin-file-upload.service";
import { createDocument } from "@services/document.service";
import { DocType } from "@utils/util.constants";
import { useDelete } from "@refinedev/core";
import { formatFileSize } from "@utils/util.functions";
interface ComponentProps {
  caseId: string;
  mainDocumentId: string;
  documents: DocumentResponseDto[];
  setDocuments: (docs: DocumentResponseDto[]) => void;
}

interface FormValues {
  files: File[];
}

const ExhibitsPanel: React.FC<ComponentProps> = ({
  caseId,
  mainDocumentId,
  documents,
  setDocuments,
}) => {
  const [files, setFiles] = useState<File[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingFiles, setUploadingFiles] = useState<
    { index: number; progress: number }[]
  >([]); // Define type for uploadingFiles
  const { mutate: deleteMutate } = useDelete();

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
          DocType.EXHIBIT,
          mainDocumentId
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

  return (
    <div className="relative">
      <FileUploadDropzone handleFileChange={handleMainFileChange} />
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
          visible={loading}
          zIndex={1000}
          overlayProps={{ radius: "sm", blur: 2 }}
          loaderProps={{ color: "pink", type: "bars" }}
        />
        {documents
          .filter((doc) => doc.mainDocumentId === mainDocumentId)
          ?.map((doc, _i) => (
            <div className="flex items-center justify-between border-b" key={doc.id}>
              <div className="font-bold flex gap-2 items-center cursor-pointer text-sm py-3">
                <IconPaperclip style={{ width: rem(20), height: rem(20) }} />
                {doc.title}
              </div>
              <button
                onClick={() => handleDeleteDocument(doc.id)}
                className="text-[#6e6e6e]"
              >
                <IconTrash style={{ width: rem(20), height: rem(20) }} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ExhibitsPanel;
