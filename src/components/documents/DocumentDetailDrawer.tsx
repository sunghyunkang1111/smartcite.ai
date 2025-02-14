import {
  Button,
  Drawer,
  Loader,
  LoadingOverlay,
  Modal,
  Select,
} from "@mantine/core";
import {
  IconArrowRight,
  IconCheck,
  IconFileTypePdf,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { IDocument } from "@/types/types";
import { DocType, UploadingState } from "@/utils/util.constants";
import { useState } from "react";
import DeleteConfirmModal from "@/components/common/DeleteBtnWithConfirmModal";
import { useDelete } from "@refinedev/core";
import { useDisclosure } from "@mantine/hooks";
import FileUploadDropzone from "./FileUploadDropzone";
import { formatFileSize } from "@/utils/util.functions";
import {
  uploadFile,
  getMediaPresignedUrl,
} from "@/services/admin-file-upload.service";
import { createDocument } from "@/services/document.service";
// import PdfViewer from "@components/common/PdfViewer";
import PdfViewer from "@/components/common/PdfViewer";
import Link from "next/link";

interface DocumentDetailDrawerProps {
  opened: boolean;
  close: () => void;
  selMDoc: any;
  setSelMDoc: (doc: any) => void;
  setMainDocuments: (docs: any) => void;
  caseTitle: string;
}

const DocumentDetailDrawer = ({
  opened,
  close,
  selMDoc,
  setSelMDoc,
  setMainDocuments,
  caseTitle,
}: DocumentDetailDrawerProps) => {
  const [
    uploadModalOpened,
    { open: openUploadModal, close: closeUploadModal },
  ] = useDisclosure(false);
  const [selEDoc, setSelEDoc] = useState<IDocument>();
  const [fileLoading, setFileLoading] = useState(false);
  const [fullLoading, setFullLoading] = useState(false);
  const { mutate: deleteMutate } = useDelete();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingStates, setUploadingStates] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>();

  const handleCloseDrawer = () => {
    close();
    setSelEDoc(undefined);
  };

  const handleDeleteSuccess = (doc: IDocument) => {
    if (doc.type === DocType.MAIN) {
      setMainDocuments((prev: any) => prev.filter((d: any) => d.id !== doc.id));
      setFullLoading(false);
      handleCloseDrawer();
    } else {
      const updatedExhibits = selMDoc.exhibits.filter(
        (d: any) => d.id !== doc.id
      );
      setSelMDoc({
        ...selMDoc,
        exhibits: updatedExhibits,
      });
      setMainDocuments((prev: any) =>
        prev.map((doc: any) => ({
          ...doc,
          exhibits: doc.id === selMDoc.id ? updatedExhibits : doc.exhibits,
        }))
      );
      setFileLoading(false);
    }
  };

  const handleDeleteDocument = async (doc: IDocument) => {
    doc.type === DocType.MAIN ? setFullLoading(true) : setFileLoading(true);

    deleteMutate(
      {
        resource: "documents",
        id: doc.id,
      },
      {
        onError: (error) => {
          console.log(error);
          setFileLoading(false);
        },
        onSuccess: () => handleDeleteSuccess(doc),
      }
    );
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadDocument = async (file: File, index: number) => {
    try {
      const presignedUrl = await getMediaPresignedUrl();
      const uploadFileResponse = await uploadFile(file, presignedUrl.uploadUrl);
      if (!uploadFileResponse) throw new Error("Failed to upload file");

      const createdDocument = await createDocument(
        selMDoc.caseId,
        presignedUrl.id,
        file.name,
        DocType.EXHIBIT,
        selMDoc.id
      );
      if (!createdDocument) throw new Error("Failed to create document");

      setUploadingStates((prev) =>
        prev.map((p, i) => (i === index ? UploadingState.SUCCESS : p))
      );
      return createdDocument;
    } catch (error: any) {
      alert(`Failed to upload file: ${error.message}`);
      setUploadingStates((prev) =>
        prev.map((p, i) => (i === index ? UploadingState.FAIL : p))
      );
      return null;
    }
  };

  const handleUpload = async () => {
    closeUploadModal();
    setUploadingFiles(files);
    setUploadingStates(files.map(() => UploadingState.DOING));

    const uploadResults = await Promise.all(
      files.map((file, i) => handleUploadDocument(file, i))
    );

    const newDocuments = uploadResults.filter(Boolean) as IDocument[];

    setSelMDoc({
      ...selMDoc,
      exhibits: [...selMDoc.exhibits, ...newDocuments],
    });

    setMainDocuments((prev: any) =>
      prev.map((doc: any) => ({
        ...doc,
        exhibits:
          doc.id === selMDoc.id
            ? [...doc.exhibits, ...newDocuments]
            : doc.exhibits,
      }))
    );

    setUploadingFiles([]);
  };

  const getSelDocCss = (selected: boolean) =>
    selected
      ? "bg-[#fafafa] border-r-4 border-r-[#292929]"
      : "bg-white border-r-4 border-r-transparent";

  const getStateBadge = (state: string) => {
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
    return badges[state];
  };

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
    <>
      <Drawer
        opened={opened}
        onClose={handleCloseDrawer}
        withCloseButton={false}
        position="right"
        size="900px"
        styles={{
          body: {
            height: "100%",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <LoadingOverlay
          visible={fullLoading}
          zIndex={1000}
          loaderProps={{ color: "black", type: "bars" }}
        />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <IconArrowRight
              onClick={close}
              size={18}
              className="hover:text-[#525252] cursor-pointer"
            />
            Document Detail
          </div>
          <div className="flex gap-2">
            <DeleteConfirmModal
              onDelete={() => handleDeleteDocument(selMDoc)}
              trigger={
                <div className="flex h-full items-center justify-center border px-2 rounded-md border-red-600 text-red-500 cursor-pointer">
                  <IconTrash size={18} />
                </div>
              }
            />
            <Button
              variant=""
              color="dark.6"
              type="submit"
              onClick={handleCloseDrawer}
            >
              Save changes
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-end">
          <Select
            label="Case Title"
            placeholder="Select option"
            data={[caseTitle]}
            value={caseTitle}
            required
            labelProps={{
              style: {
                color: "black",
                marginBottom: "6px",
              },
            }}
            styles={{
              root: {
                width: "400px",
              },
            }}
          />
          <Button
            variant="default"
            color="dark.6"
            leftSection={<IconUpload size={14} />}
            onClick={openUploadModal}
          >
            Upload document
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-11 text-xs flex-1 gap-4 pb-2">
          <div className="col-span-5 border rounded-xl relative">
            <LoadingOverlay
              visible={fileLoading}
              zIndex={1000}
              loaderProps={{ color: "black", type: "bars" }}
            />
            <div className="flex items-center py-3">
              <div className="w-10 pl-6">#</div>
              <div className="flex-1">Exhibits Name</div>
              <div className="w-20 text-center">Actions</div>
            </div>
            {selMDoc?.exhibits.map((doc: any, _i: number) => (
              <div
                key={doc.id}
                onClick={() => setSelEDoc(doc)}
                className={`flex items-center py-4 cursor-pointer border-t ${getSelDocCss(
                  doc.id == selEDoc?.id
                )}`}
              >
                <div className="w-10 pl-6">{_i + 1}</div>
                <div className="flex-1 text-[#0550b3] truncate underline flex items-center gap-2">
                  <Link
                    href={`/exhibits?caseId=${selMDoc.caseId}&documentId=${selMDoc.id}&exhibitId=${doc.id}`}
                    className="truncate underline"
                  >
                    {doc.title}
                  </Link>
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
            {uploadingFiles?.map((file, i) => (
              <div key={i} className="flex py-4 border-t">
                <div className="w-10 pl-3">
                  {selMDoc.exhibits.length + i + 1}
                </div>
                <div className="flex-1 text-[#0550b3] truncate">
                  <div className="truncate flex items-center gap-2">
                    <div className="truncate underline">{file.name}</div>
                    <div className="pr-9 flex-1">
                      {getStateBadge(uploadingStates[i])}
                    </div>
                  </div>
                  <div className="text-[#bdbdbd] text-sm mt-1 truncate">
                    {uploadingStates[i] === UploadingState.DOING
                      ? "Document is currently processing..."
                      : "Document ready for citation use"}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="col-span-6 rounded-xl p-2 pt-4 pb-4 relative bg-[#eeeff1] border">
            {selEDoc?.mediaUrl && <PdfViewer mediaUrl={selEDoc.mediaUrl} />}
          </div>
        </div>
      </Drawer>
      <Modal
        opened={uploadModalOpened}
        onClose={closeUploadModal}
        title="Upload Document"
        centered
        size="lg"
      >
        <FileUploadDropzone handleFileChange={setFiles} />
        {renderFileList()}
        <div className="flex justify-end gap-2">
          <Button
            variant="default"
            color="dark.6"
            style={{ borderColor: "black" }}
            onClick={closeUploadModal}
          >
            Cancel
          </Button>
          <Button
            variant=""
            color="dark.6"
            type="submit"
            disabled={files.length === 0}
            onClick={handleUpload}
          >
            Upload
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default DocumentDetailDrawer;
