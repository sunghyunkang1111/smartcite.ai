import React, { useState } from "react";
import { Button, Loader, LoadingOverlay, Modal, Select } from "@mantine/core";
import {
  IconCheck,
  IconFileTypePdf,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { formatFileSize } from "@/utils/util.functions";
import {
  uploadFile,
  getMediaPresignedUrl,
} from "@/services/admin-file-upload.service";
import { createDocument } from "@/services/document.service";
import { IDocument } from "@/types/types";
import { DocType, UploadingState } from "@/utils/util.constants";
import DeleteConfirmModal from "@/components/common/DeleteBtnWithConfirmModal";
import { useDataProvider } from "@refinedev/core";
import FileUploadDropzone from "@/components/documents/FileUploadDropzone";
import { notification } from "antd";

// Types
interface AddExhibitProps {
  cases: any[];
  setDocuments: (
    documents: IDocument[] | ((prev: IDocument[]) => IDocument[])
  ) => void;
  mainDocuments: any[];
}

interface UploadStateBadgeProps {
  state: string;
}

const AddExhibit = ({
  cases,
  setDocuments,
  mainDocuments,
}: AddExhibitProps) => {
  // State management
  const [opened, { open, close }] = useDisclosure(false);
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingStates, setUploadingStates] = useState<string[]>([]);
  const [uploadedMainFile, setUploadedMainFile] = useState<IDocument | null>(
    null
  );
  const [uploadedExhibitFiles, setUploadedExhibitFiles] = useState<IDocument[]>(
    []
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedMainDocId, setSelectedMainDocId] = useState<string | null>(
    null
  );

  const dataProvider = useDataProvider();

  const resetModalState = () => {
    setStep(1);
    setFiles([]);
    setUploadedMainFile(null);
    setUploadedExhibitFiles([]);
    setUploadingStates([]);
    setSelectedCaseId(null);
    setSelectedMainDocId(null);
  };

  const handleModalClose = () => {
    const newDocuments = [
      ...(uploadedMainFile ? [uploadedMainFile] : []),
      ...uploadedExhibitFiles,
    ];
    setDocuments((prev: IDocument[]) => [...prev, ...newDocuments]);
    close();
    resetModalState();
  };

  const handleFinish = () => {
    notification.success({
      message: "Document Added",
      description: "Document has been added successfully",
    });
    handleModalClose();
  };

  const handleFileRemoval = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSuccess = (docType: string, newDocuments: IDocument[]) => {
    if (docType === DocType.MAIN) {
      setUploadedMainFile(newDocuments[0]);
      setStep(2);
    } else {
      setUploadedExhibitFiles((prev) => [...prev, ...newDocuments]);
      setStep(3);
    }
    setFiles([]);
    setUploadingStates([]);
  };

  const handleSingleDocumentUpload = async (
    file: File,
    index: number,
    docType: string,
    mainDocument: string
  ): Promise<IDocument | null> => {
    try {
      const presignedUrl = await getMediaPresignedUrl();
      const uploadResponse = await uploadFile(file, presignedUrl.uploadUrl);
      if (!uploadResponse) throw new Error("File upload failed");

      const document = await createDocument(
        selectedCaseId as string,
        presignedUrl.id,
        file.name,
        docType,
        mainDocument
      );

      if (!document) throw new Error("Document creation failed");

      setUploadingStates((prev) =>
        prev.map((state, i) => (i === index ? UploadingState.SUCCESS : state))
      );
      return document;
    } catch (error) {
      console.error("Document upload failed:", error);
      setUploadingStates((prev) =>
        prev.map((state, i) => (i === index ? UploadingState.FAIL : state))
      );
      return null;
    }
  };

  const handleBulkUpload = async (docType: string, mainDocument: string) => {
    setUploadingStates(files.map(() => UploadingState.DOING));
    setLoading(true);

    try {
      const uploadResults = await Promise.all(
        files.map((file, i) =>
          handleSingleDocumentUpload(file, i, docType, mainDocument)
        )
      );

      const successfulUploads = uploadResults.filter(Boolean) as IDocument[];
      handleUploadSuccess(docType, successfulUploads);
    } catch (error) {
      console.error("Bulk upload failed:", error);
    } finally {
      setLoading(false);
      setUploadingStates([]);
    }
  };

  const handleDocumentDeletion = async (doc: IDocument) => {
    setLoading(true);
    try {
      await dataProvider().deleteOne({
        resource: "documents",
        id: doc.id,
        meta: { skipAutoRefresh: true },
      });
      setUploadedExhibitFiles((prev) => prev.filter((d) => d.id !== doc.id));
      notification.success({
        message: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Document deletion failed:", error);
      notification.error({
        message: "Error",
        description: "Failed to delete document. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  // UI Components
  const UploadStateBadge = ({ state }: UploadStateBadgeProps) => {
    const badges = {
      [UploadingState.DOING]: <Loader color="orange" size={14} />,
      [UploadingState.SUCCESS]: (
        <div className="w-4 h-4 rounded-full bg-[#4bae4f] flex items-center justify-center text-white">
          <IconCheck size={10} />
        </div>
      ),
      [UploadingState.FAIL]: (
        <div className="w-4 h-4 rounded-full bg-[#e73b3b] flex items-center justify-center text-white">
          <IconX size={10} />
        </div>
      ),
    };
    return badges[state] || null;
  };

  const FileList = () => (
    <div className="py-2 flex flex-col">
      {files?.map((file, index) => (
        <div
          key={index}
          className="border p-4 my-2 rounded-lg flex gap-4 items-center"
        >
          <div className="w-10">
            <IconFileTypePdf size={32} color="#e31e24" />
          </div>
          <div className="flex flex-col gap-1 flex-1 truncate">
            <div className="text-sm text-black truncate flex items-center gap-2">
              <div className="truncate">{file.name}</div>
              <UploadStateBadge state={uploadingStates[index]} />
            </div>
            <div className="text-xs flex justify-between">
              {formatFileSize(file.size)}
            </div>
          </div>
          <div className="w-10">
            <IconX
              size={20}
              onClick={() => handleFileRemoval(index)}
              className="cursor-pointer"
            />
          </div>
        </div>
      ))}
    </div>
  );

  const StepOne = () => (
    <>
      <div className="text-[#7c7c7c] pb-4">
        Select the case for this document this exhibit belongs to
      </div>
      <Select
        onChange={setSelectedCaseId}
        label="Case Title"
        placeholder="Select Case"
        data={cases.map((c) => ({
          label: c.title,
          value: c.id,
        }))}
        value={selectedCaseId}
        labelProps={{
          style: { color: "black", marginBottom: "6px" },
        }}
        className="mb-1"
      />
      <div className="text-xs mb-4 text-[#989898]">
        Select a case first to access its documents
      </div>
      <Select
        onChange={setSelectedMainDocId}
        label="Main Document"
        placeholder="Select option"
        data={mainDocuments?.map((d: any) => ({
          label: d.title,
          value: d.id,
        }))}
        value={selectedMainDocId}
        labelProps={{
          style: { color: "black", marginBottom: "6px" },
        }}
        className="mb-1"
      />
      <div className="flex justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-12 bg-[#292929] rounded-full"></div>
          <div className="h-2 w-12 bg-[#efefef] rounded-full"></div>
          <div className="h-2 w-12 bg-[#efefef] rounded-full"></div>
          <div className="text-[#989898]">1/3 Steps</div>
        </div>
        <Button
          variant=""
          loading={loading}
          color="dark.6"
          type="submit"
          disabled={selectedMainDocId === null}
          onClick={() => setStep(2)}
        >
          Next
        </Button>
      </div>
    </>
  );

  const StepTwo = () => (
    <>
      <div className="text-[#7c7c7c] pb-4">
        Upload an exhibit for the document{" "}
        <span className="text-[#292929]">
          &apos;{mainDocuments.find((d) => d.id === selectedMainDocId)?.title}
          &apos;
        </span>
      </div>
      <FileUploadDropzone handleFileChange={setFiles} />
      <FileList />
      <div className="flex justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-12 bg-[#292929] rounded-full"></div>
          <div className="h-2 w-12 bg-[#292929] rounded-full"></div>
          <div className="h-2 w-12 bg-[#efefef] rounded-full"></div>
          <div className="text-[#989898]">2/3 Steps</div>
        </div>
        <Button
          variant=""
          loading={loading}
          color="dark.6"
          type="submit"
          disabled={files.length === 0}
          onClick={() =>
            handleBulkUpload(DocType.EXHIBIT, selectedMainDocId ?? "")
          }
        >
          Next
        </Button>
      </div>
    </>
  );

  const StepThree = () => (
    <>
      <div className="border rounded-xl relative text-sm">
        <LoadingOverlay
          visible={loading}
          zIndex={1000}
          loaderProps={{ color: "black", type: "bars" }}
        />
        <div className="flex items-center py-3 text-[#7c7c7c]">
          <div className="w-20 pl-6">#</div>
          <div className="flex-1">Exhibits Name</div>
          <div className="w-20 text-center">Actions</div>
        </div>
        {uploadedExhibitFiles.map((doc: IDocument, index: number) => (
          <div
            key={doc.id}
            className={`flex items-center py-4 cursor-pointer border-t`}
          >
            <div className="w-20 pl-6">{index + 1}</div>
            <div className="flex-1 text-[#0550b3] truncate underline flex items-center gap-2">
              <div className="truncate underline">{doc.title}</div>
            </div>
            <div className="w-20" onClick={(e) => e.stopPropagation()}>
              <DeleteConfirmModal
                onDelete={() => handleDocumentDeletion(doc)}
                trigger={
                  <span className="cursor-pointer flex justify-center text-[#989898] hover:text-[#2e2e2e]">
                    <IconTrash size={20} />
                  </span>
                }
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-12 bg-[#292929] rounded-full"></div>
          <div className="h-2 w-12 bg-[#292929] rounded-full"></div>
          <div className="h-2 w-12 bg-[#292929] rounded-full"></div>
          <div className="text-[#989898]">3/3 Steps</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            color="dark.6"
            style={{ borderColor: "black" }}
            onClick={() => setStep(1)}
          >
            Previous
          </Button>
          <Button
            variant=""
            color="dark.6"
            type="submit"
            onClick={handleFinish}
          >
            Finish
          </Button>
        </div>
      </div>
    </>
  );

  const StepComponents = [
    <StepOne key="step-1" />,
    <StepTwo key="step-2" />,
    <StepThree key="step-3" />,
  ];

  return (
    <>
      <Button variant="" color="dark.6" onClick={open}>
        + Add Exhibit
      </Button>
      <Modal
        opened={opened}
        onClose={handleModalClose}
        title="Add Exhibit"
        centered
        size="lg"
      >
        {StepComponents[step - 1]}
      </Modal>
    </>
  );
};

export default AddExhibit;
