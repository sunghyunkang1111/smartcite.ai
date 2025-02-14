import { useEffect, useState } from "react";
import { Modal, Button, TextInput, Select } from "@mantine/core";
import { IconFileTypePdf, IconX } from "@tabler/icons-react";
import { IDocument } from "@/types/types";
import { DocType } from "@/utils/util.constants";
import FileUploadDropzone from "@/components/documents/FileUploadDropzone";
import { formatFileSize } from "@/utils/util.functions";

interface UploadExhibitModalProps {
  documents: IDocument[];
  opened: boolean;
  open: () => void;
  close: () => void;
  caseTitle: string;
  mainDocumentId: string;
  handleUploadFile: (
    files: File[],
    dockType: string,
    mainDocId: string
  ) => void;
}

const UploadExhibitModal = ({
  documents,
  opened,
  close,
  caseTitle,
  mainDocumentId,
  handleUploadFile,
}: UploadExhibitModalProps) => {
  // State
  const [exhibitCaseTitle, setExhibitCaseTitle] = useState(caseTitle);
  const [exhibitMainDocument, setExhibitMainDocument] =
    useState(mainDocumentId);
  const [files, setFiles] = useState<File[]>([]);

  // Effects
  useEffect(() => {
    setExhibitCaseTitle(caseTitle);
  }, [caseTitle]);

  useEffect(() => {
    setExhibitMainDocument(mainDocumentId);
  }, [mainDocumentId]);

  // Handlers
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    handleUploadFile(files, DocType.EXHIBIT, exhibitMainDocument);
    close();
    setFiles([]);
  };

  // Computed values
  const mainDocumentOptions = documents
    .filter((doc) => doc.type === DocType.MAIN)
    .map((doc) => ({
      value: doc.id,
      label: doc.title,
    }));

  const labelStyle = {
    color: "black",
    marginBottom: "6px",
  };

  const isSubmitDisabled = !exhibitCaseTitle || !exhibitMainDocument;

  // Render file list
  const renderFileList = () => (
    <div className="py-2 flex flex-col">
      {files?.map((file, index) => (
        <div
          key={index}
          className="border p-4 my-2 rounded-lg flex gap-4 items-center"
        >
          <IconFileTypePdf size={32} color="#e31e24" />
          <div className="flex flex-col gap-1 flex-1">
            <div className="text-sm text-black">{file.name}</div>
            <div className="text-xs flex justify-between">
              {formatFileSize(file.size)}
            </div>
          </div>
          <IconX
            size={20}
            onClick={() => handleRemoveFile(index)}
            className="cursor-pointer"
          />
        </div>
      ))}
    </div>
  );

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Upload Exhibit"
      size="lg"
      styles={{
        title: {
          color: "black",
        },
      }}
    >
      <div className="flex flex-col gap-4">
        <TextInput
          required
          label="Case Title"
          placeholder="Enter case title here"
          disabled
          value={exhibitCaseTitle}
          onChange={(e) => setExhibitCaseTitle(e.currentTarget.value)}
          radius="sm"
          labelProps={{ style: labelStyle }}
        />

        <Select
          label="Main Document"
          placeholder="Select option"
          data={mainDocumentOptions}
          value={exhibitMainDocument}
          onChange={(value) => setExhibitMainDocument(value as string)}
          required
          labelProps={{ style: labelStyle }}
        />

        <FileUploadDropzone handleFileChange={setFiles} />

        {renderFileList()}
      </div>

      <div className="flex justify-end mt-4 gap-2">
        <Button
          variant="default"
          color="dark.6"
          style={{ borderColor: "black" }}
          onClick={close}
        >
          Cancel
        </Button>
        <Button
          variant=""
          color="dark.6"
          type="submit"
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
        >
          Upload
        </Button>
      </div>
    </Modal>
  );
};

export default UploadExhibitModal;
