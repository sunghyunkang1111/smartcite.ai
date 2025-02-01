import { useState } from "react";
import { Button, Loader, LoadingOverlay, Modal } from "@mantine/core";
import {
  IconCheck,
  IconFileTypePdf,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import FileUploadDropzone from "./FileUploadDropzone";
import { formatFileSize } from "@/utils/util.functions";
import { uploadFile } from "@/services/admin-file-upload.service";
import { getMediaPresignedUrl } from "@/services/admin-file-upload.service";
import { createDocument } from "@/services/document.service";
import { IDocument } from "@/types/types";
import { DocType, UploadingState } from "@/utils/util.constants";
import DeleteConfirmModal from "@/components/common/DeleteBtnWithConfirmModal";
import { useDataProvider } from "@refinedev/core";

interface AddExhibitProps {
  document: IDocument;
  setDocuments: (
    documents: IDocument[] | ((prev: IDocument[]) => IDocument[])
  ) => void;
}

const AddExhibit = ({ document, setDocuments }: AddExhibitProps) => {
  // State
  const [opened, { open, close }] = useDisclosure(false);
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingStates, setUploadingStates] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<IDocument[]>([]);
  const dataProvider = useDataProvider();

  // File handling
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Modal handling
  const handleCloseModal = () => {
    close();
    setFiles([]);
    setUploadingStates([]);
    setUploadedFiles([]);
    setStep(1);
  };

  const handleFinish = () => {
    handleCloseModal();
    setDocuments((prev: IDocument[]) => [...prev, ...uploadedFiles]);
  };

  // Upload handling
  const handleUpload = async () => {
    setUploadingStates(files.map(() => UploadingState.DOING));
    setLoading(true);

    try {
      const uploadResults = await Promise.all(
        files.map((file, i) => handleUploadDocument(file, i))
      );

      const newDocuments = uploadResults.filter(Boolean) as IDocument[];
      setUploadedFiles(newDocuments);
      setStep(2);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
      setUploadingStates([]);
    }
  };

  const handleUploadDocument = async (file: File, index: number) => {
    try {
      const presignedUrl = await getMediaPresignedUrl();
      const uploadFileResponse = await uploadFile(file, presignedUrl.uploadUrl);
      if (!uploadFileResponse) throw new Error("Failed to upload file");

      const createdDocument = await createDocument(
        document.caseId,
        presignedUrl.id,
        file.name,
        DocType.EXHIBIT,
        document.id
      );
      if (!createdDocument) throw new Error("Failed to create document");

      setUploadingStates((prev) =>
        prev.map((p, i) => (i === index ? UploadingState.SUCCESS : p))
      );
      return createdDocument;
    } catch (error: any) {
      console.error("Document upload failed:", error);
      setUploadingStates((prev) =>
        prev.map((p, i) => (i === index ? UploadingState.FAIL : p))
      );
      return null;
    }
  };

  const handleDeleteDocument = async (doc: IDocument) => {
    setLoading(true);
    try {
      await dataProvider().deleteOne({
        resource: "documents",
        id: doc.id,
        meta: { skipAutoRefresh: true },
      });
      setUploadedFiles((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // UI Components
  const UploadStateBadge = ({ state }: { state: string }) => {
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
              onClick={() => handleRemoveFile(index)}
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
        Upload an exhibit for the document
      </div>
      <FileUploadDropzone handleFileChange={setFiles} />
      <FileList />
      <div className="flex justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-12 bg-[#292929] rounded-full"></div>
          <div className="h-2 w-12 bg-[#efefef] rounded-full"></div>
          <div className="text-[#989898]">1/2 Steps</div>
        </div>
        <Button
          variant=""
          color="dark.6"
          type="submit"
          disabled={files.length === 0}
          onClick={handleUpload}
        >
          Next
        </Button>
      </div>
    </>
  );

  const StepTwo = () => (
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
        {uploadedFiles.map((doc: any, _i: number) => (
          <div
            key={doc.id}
            className={`flex items-center py-4 cursor-pointer border-t`}
          >
            <div className="w-20 pl-6">{_i + 1}</div>
            <div className="flex-1 text-[#0550b3] truncate underline flex items-center gap-2">
              <div className="truncate underline">{doc.title}</div>
            </div>
            <div className="w-20" onClick={(e) => e.stopPropagation()}>
              <DeleteConfirmModal
                onDelete={() => handleDeleteDocument(doc)}
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
          <div className="text-[#989898]">2/2 Steps</div>
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

  return (
    <>
      <IconPlus
        size={20}
        className="cursor-pointer hover:text-[#2e2e2e]"
        onClick={open}
      />
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title="Add Exhibit"
        centered
        size="lg"
      >
        {step === 1 ? <StepOne /> : <StepTwo />}
      </Modal>
    </>
  );
};

export default AddExhibit;
