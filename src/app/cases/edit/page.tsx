"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, LoadingOverlay, Loader, Modal } from "@mantine/core";
import {
  useCreate,
  useDelete,
  useList,
  useOne,
  useParsed,
} from "@refinedev/core";
import { useDisclosure } from "@mantine/hooks";
import { Layout as BaseLayout } from "@/components/layout";
import {
  IconCheck,
  IconChevronRight,
  IconClick,
  IconRefresh,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { ICase, ICitation, IDocument } from "@/types/types";
import {
  getMediaPresignedUrl,
  uploadFile,
} from "@/services/admin-file-upload.service";
import { createDocument } from "@/services/document.service";
import { DocType } from "@/utils/util.constants";
import DeleteConfirmModal from "@/components/common/DeleteBtnWithConfirmModal";
import UploadExhibitModal from "@/components/case/UploadExhibitModal";
import DecriptionPanel from "@/components/case/edit/DecriptionPanel";
import GeneralInformationWithHeader from "@/components/case/edit/GeneralInformationWithHeader";
import EmptyDropzone from "@/components/case/edit/EmptyDropzone";
import { getCitations } from "@services/citation.service";
import { Dropzone } from "@mantine/dropzone";
import Link from "next/link";
import { notification } from "antd";
import pRetry from "p-retry";
import PdfViewer from "@components/common/PdfViewer";

// Constants
const PANEL_CONFIGS = {
  noDocuments: {
    Main: "col-span-12",
    Exhibit: "hidden",
    Document: "hidden",
  },
  mainDocSelected: {
    Main: "col-span-5",
    Exhibit: "flex flex-col col-span-6",
    Document: "block col-span-5",
  },
  mainDocOnly: {
    Main: "col-span-5",
    Exhibit: "flex flex-col col-span-6",
    Document: "hidden",
  },
};

const UploadingState = {
  DOING: "DOING",
  SUCCESS: "SUCCESS",
  FAIL: "FAIL",
};

const ProcessingStatus = {
  IN_PROGRESS: "IN_PROGRESS",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

const CitationsExtractionStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

const CaseEditPage = () => {
  // State hooks
  const [
    uploadModalOpened,
    { open: openUploadModal, close: closeUploadModal },
  ] = useDisclosure(false);
  const [selMDocId, setSelMDocId] = useState<string>();
  const [selEDocId, setSelEDocId] = useState<string>();
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, File[]>>(
    new Map()
  );
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingStates, setUploadingStates] = useState<string[]>([]);
  const [panelsCss, setPanelsCss] = useState(PANEL_CONFIGS.noDocuments);
  const [citations, setCitations] = useState<ICitation[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<IDocument>();

  const openModal = (e: any, doc: IDocument) => {
    e.preventDefault();
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedDoc(undefined);
    setIsModalOpen(false);
  };

  // URL params
  const { params } = useParsed();
  const caseId = params?.caseId;
  const hideHeader = params?.hideHeader === "true";

  // Data fetching hooks
  const { data: caseData } = useOne<ICase>({
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

  const pollingRef = useRef(false);

  useEffect(() => {
    const pollDocuments = async () => {
      if (pollingRef.current) return;
      pollingRef.current = true;
  
      try {
        await pRetry(
          async () => {
            const response: any = await refetchDocuments();
            const updatedDocuments = response.data?.data?.items as IDocument[];
  
            const inProgressDocs = updatedDocuments.filter(
              (doc: IDocument) =>
                doc.processingStatus === ProcessingStatus.IN_PROGRESS ||
                doc.processingStatus === ProcessingStatus.PENDING ||
                doc.citationsExtractionStatus === CitationsExtractionStatus.IN_PROGRESS ||
                doc.citationsExtractionStatus === CitationsExtractionStatus.PENDING
            );
  
            if (inProgressDocs.length > 0) {
              throw new Error("Some documents are still in progress");
            }
  
            const statusChanged = updatedDocuments.some((updatedDoc) => {
              const existingDoc = documents.find((doc) => doc.id === updatedDoc.id);
              return (
                existingDoc?.processingStatus !== updatedDoc?.processingStatus ||
                existingDoc?.citationsExtractionStatus !== updatedDoc?.citationsExtractionStatus
              );
            });
  
            if (statusChanged) {
              setDocuments(updatedDocuments);
            }
          },
          {
            forever: true,
            minTimeout: 5000,
          }
        );
      } catch (error) {
        console.error("Polling error:", error);
      } finally {
        pollingRef.current = false;
      }
    };
  
    if (!pollingRef.current) {
      pollDocuments();
    }
  }, [refetchDocuments, documents]);
  
  const { mutate: createMutate } = useCreate();
  const { mutate: deleteMutate } = useDelete();

  // Helper functions
  const getMDocs = () => documents.filter((doc) => doc.type === DocType.MAIN);
  const getEDocs = () =>
    documents.filter((doc) => doc.mainDocumentId === selMDocId);

  const getSelDocCss = (selected: boolean) =>
    selected
      ? "bg-[#fafafa] border-r-4 border-r-[#292929]"
      : "bg-white border-r-4 border-r-transparent";

  const getUploadingStateBadge = (state: string) => {
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

  const getGeneralStateBadge = (doc: IDocument) => {
    if (
      doc.processingStatus == ProcessingStatus.COMPLETED &&
      (doc.citationsExtractionStatus == null ||
        doc.citationsExtractionStatus == CitationsExtractionStatus.COMPLETED)
    ) {
      return (
        <div className="w-4 h-4 rounded-full bg-[#4bae4f] flex items-center justify-center text-white">
          <IconCheck size={10} />
        </div>
      );
    } else if (doc.processingStatus == ProcessingStatus.FAILED) {
      return (
        <div className="w-4 h-4 rounded-full bg-[#e73b3b] flex items-center justify-center text-white">
          <IconX size={10} />
        </div>
      );
    }
    return <Loader color="orange" size={14} />;
  };

  const getGeneralStateText = (doc: IDocument) => {
    if (doc.processingStatus === ProcessingStatus.PENDING) {
      return "Uploading document for processing...";
    }

    if (doc.processingStatus === ProcessingStatus.IN_PROGRESS) {
      return "Processing and extracting document...";
    }

    if (doc.processingStatus === ProcessingStatus.COMPLETED) {
      if (doc.citationsExtractionStatus === null) {
        return "Document ready for citations extraction";
      }
      if (
        doc.citationsExtractionStatus === CitationsExtractionStatus.COMPLETED
      ) {
        return "Citations are successfully extracted";
      }
      return "Extracting citations...";
    }

    return "Document processing failed";
  };

  const getExhibitGeneralStateBadge = (doc: IDocument) => {
    if (doc.processingStatus == ProcessingStatus.COMPLETED) {
      return (
        <div className="w-4 h-4 rounded-full bg-[#4bae4f] flex items-center justify-center text-white">
          <IconCheck size={10} />
        </div>
      );
    } else if (doc.processingStatus == ProcessingStatus.FAILED) {
      return (
        <div className="w-4 h-4 rounded-full bg-[#e73b3b] flex items-center justify-center text-white">
          <IconX size={10} />
        </div>
      );
    }
    return <Loader color="orange" size={14} />;
  };

  const getExhibitGeneralStateText = (doc: IDocument) => {
    if (doc.processingStatus === ProcessingStatus.PENDING) {
      return "Uploading document for processing...";
    }

    if (doc.processingStatus === ProcessingStatus.IN_PROGRESS) {
      return "Processing and extracting document...";
    }

    if (doc.processingStatus === ProcessingStatus.COMPLETED) {
      return "Document is successfully processed and extracted";
    }

    return "Document processing failed";
  };

  const getCitedInMainDocuments = (exhDocId: string) => {
    const exhDoc = documents.find((doc) => doc.id === exhDocId);
    if (!exhDoc) return [];

    const citedInMainDocIds = citations
      .filter(
        (citation) =>
          citation.destinationDocumentId === exhDocId &&
          citation.sourceDocumentId !== exhDoc.mainDocumentId
      )
      .map((citation) => citation.sourceDocumentId);
    const citedInMainDocs = documents.filter((doc) =>
      citedInMainDocIds.includes(doc.id)
    );
    return citedInMainDocs;
  };

  // Event handlers
  const handleUploadFile = async (
    fs: File[],
    dockType: string,
    mainDocId: string
  ) => {
    const newDocuments: IDocument[] = [];
    setUploadingFiles((prev) => {
      prev.set(dockType, fs);
      return prev;
    });
    setUploadingStates(fs.map(() => UploadingState.DOING));

    const uploadPromises = fs.map(async (file, i) => {
      try {
        const presignedUrl = await getMediaPresignedUrl();
        const uploadFileResponse = await uploadFile(
          file,
          presignedUrl.uploadUrl
        );
        if (!uploadFileResponse) throw new Error("Failed to upload file");

        const createdDocument = await createDocument(
          caseId,
          presignedUrl.id,
          file.name,
          dockType,
          mainDocId
        );
        if (!createdDocument) throw new Error("Failed to create document");

        setUploadingStates((prev) =>
          prev.map((p, _i) => (_i === i ? UploadingState.SUCCESS : p))
        );
        newDocuments.push(createdDocument);
      } catch (error: any) {
        notification.error({
          message: "Error",
          description: "Failed to upload file",
        });
        setUploadingStates((prev) =>
          prev.map((p, _i) => (_i === i ? UploadingState.FAIL : p))
        );
      }
    });

    await Promise.all(uploadPromises);
    setDocuments([...documents, ...newDocuments]);
    setUploadingFiles(new Map());
  };

  const handleDeleteDocument = async (doc: IDocument) => {
    setLoading(true);
    doc.type === DocType.MAIN
      ? setSelMDocId(undefined)
      : setSelEDocId(undefined);

    deleteMutate(
      {
        resource: `documents`,
        id: doc.id,
      },
      {
        onError: (error) => {
          console.log(error);
          setLoading(false);
        },
        onSuccess: () => {
          setDocuments(documents.filter((d) => d.id !== doc.id));
          setLoading(false);
        },
      }
    );
  };

  // Effects
  useEffect(() => {
    const hasMainDocs = getMDocs().length > 0;

    if (!hasMainDocs) {
      setPanelsCss(PANEL_CONFIGS.noDocuments);
    } else if (selMDocId && selEDocId) {
      setPanelsCss(PANEL_CONFIGS.mainDocSelected);
    } else {
      setPanelsCss(PANEL_CONFIGS.mainDocOnly);
    }
  }, [selMDocId, selEDocId, documents]);

  useEffect(() => {
    const d = documentData?.data as any;
    if (d) {
      setDocuments(d?.items as IDocument[]);
    }
  }, [documentData]);

  useEffect(() => {
    if (documents.length > 0) {
      getMDocs().forEach((doc) => {
        getCitations(doc.id).then((res: any) => {
          const citations = res.items as ICitation[];
          setCitations((prev) => [...prev, ...citations]);
        });
      });
    }
  }, [documents]);

  useEffect(() => {
    setSelEDocId(undefined);
  }, [selMDocId]);

  const handleExtractCitations = async () => {
    createMutate(
      {
        resource: `documents/${selMDocId}/extract-citations`,
        values: {},
      },
      {
        onError: (error) => console.log(error),
        onSuccess: () => {
          setLoading(false);
          refetchDocuments();
        },
      }
    );
  };

  return (
    <BaseLayout>
      <div className="p-6 min-h-screen flex flex-col">
        <GeneralInformationWithHeader
          caseData={caseData?.data}
          hideHeader={true}
        />
        <div className="bg-white rounded-lg p-4 mt-6 flex flex-col flex-1 relative">
          <LoadingOverlay
            visible={loading || documentLoading}
            zIndex={1000}
            loaderProps={{ color: "black", type: "bars" }}
          />
          <div className="flex justify-between">
            <div className="text-xl text-[#292929]">Document List</div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={(e) =>
                handleUploadFile(
                  Array.from(e.target.files || []),
                  DocType.MAIN,
                  DocType.MAIN
                )
              }
              accept="application/pdf"
              multiple
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExtractCitations}
                disabled={!selMDocId}
                variant="default"
                leftSection={<IconRefresh size={14} />}
              >
                Extract citations
              </Button>
              {/* <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button
                    variant="default"
                    color="dark.6"
                    leftSection={<IconUpload size={14} />}
                  >
                    Upload document
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={handleMenuItemClick}>
                    Upload main documents
                  </Menu.Item>
                  <Menu.Item onClick={openUploadModal} disabled={!selMDocId}>
                    Upload exhibit
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu> */}
            </div>
          </div>
          <div className="grid grid-cols-12 text-sm gap-1 flex-1 pt-6 text-[#989898]">
            <div
              className={` rounded-xl border flex flex-col ${panelsCss.Main}`}
            >
              <div className="flex items-center py-3">
                <div className="w-10 pl-3">#</div>
                <div className="flex-1">Document Name</div>
                <div className="w-20 text-center">Actions</div>
              </div>
              {getMDocs().map((doc, _i) => (
                <div
                  key={doc.id}
                  // onClick={() => setSelMDocId(doc.id)}
                  className={`flex py-4 border-t ${getSelDocCss(
                    doc.id == selMDocId
                  )}`}
                >
                  <div className="w-10 pl-3">{_i + 1}</div>
                  <div className="flex-1 text-[#0550b3] truncate">
                    <div className="truncate flex items-center gap-2">
                      <a
                        href="#"
                        className="truncate underline"
                        onClick={(e) => openModal(e, doc)}
                      >
                        {doc.title}
                      </a>
                      <div className="flex-1">{getGeneralStateBadge(doc)}</div>
                    </div>
                    <div className="text-[#bdbdbd] text-sm mt-1 truncate">
                      {getGeneralStateText(doc)}
                    </div>
                  </div>
                  <div
                    className="w-20 flex items-center justify-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DeleteConfirmModal
                      onDelete={() => handleDeleteDocument(doc)}
                      trigger={
                        <div className="cursor-pointer flex justify-center text-[#989898] hover:text-[#2e2e2e]">
                          <IconTrash size={20} />
                        </div>
                      }
                    />
                    <IconChevronRight
                      size={20}
                      className="cursor-pointer text-[#989898] hover:text-[#2e2e2e]"
                      onClick={() => setSelMDocId(doc.id)}
                    />
                  </div>
                </div>
              ))}
              {uploadingFiles.get(DocType.MAIN)?.map((file, i) => (
                <div key={i} className="flex py-4 border-t">
                  <div className="w-10 pl-3">{getMDocs().length + i + 1}</div>
                  <div className="flex-1 text-[#0550b3] truncate">
                    <div className="truncate flex items-center gap-2">
                      <div className="truncate underline">{file.name}</div>
                      <div className="pr-9 flex-1">
                        {getUploadingStateBadge(uploadingStates[i])}
                      </div>
                    </div>
                    <div className="text-[#bdbdbd] text-sm mt-1 truncate">
                      {uploadingStates[i] === UploadingState.DOING
                        ? "Document is currently uploading..."
                        : "Document is successfully uploaded"}
                    </div>
                  </div>
                </div>
              ))}
              {getMDocs().length == 0 && !uploadingFiles.get(DocType.MAIN) ? (
                <EmptyDropzone
                  handleUploadFile={(files) =>
                    handleUploadFile(files, DocType.MAIN, DocType.MAIN)
                  }
                  label="Main Document List is Empty"
                />
              ) : (
                <Dropzone
                  p={0}
                  multiple
                  radius="xl"
                  maxSize={30 * 1024 ** 2}
                  onDrop={(files) =>
                    handleUploadFile(files, DocType.MAIN, DocType.MAIN)
                  }
                  accept={["application/pdf"]}
                  className="flex-1 rounded-none flex items-center justify-center border-0"
                >
                  <div className="flex justify-center items-center cursor-pointer h-full flex-col py-10">
                    <IconUpload size={40} color="black" />
                    <div className="text-base text-black mt-3">
                      Upload Citing Document
                    </div>
                    <div className="text-[#7c7c7c] text-center px-4">
                      Drag your file into this box to get started
                    </div>
                  </div>
                </Dropzone>
              )}
            </div>
            <div className={` rounded-xl border  ${panelsCss.Exhibit}`}>
              <div className="flex items-center py-3">
                <div className="w-20 pl-6">#</div>
                <div className="flex-1">Exhibits Name</div>
                <div className="w-20 text-center">Actions</div>
              </div>
              {selMDocId &&
                getEDocs().map((doc, _i) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelEDocId(doc.id)}
                    className={`flex items-center py-4 cursor-pointer border-t ${getSelDocCss(
                      doc.id == selEDocId
                    )}`}
                  >
                    <div className="w-20 pl-6">{_i + 1}</div>
                    <div className="flex-1 text-[#0550b3] truncate gap-2">
                      <div className="truncate flex items-center gap-2">
                        <Link
                          href={`/exhibits?caseId=${caseId}&documentId=${selMDocId}`}
                          className="truncate underline"
                        >
                          {doc.title}
                        </Link>
                        <div className="flex-1">
                          {getExhibitGeneralStateBadge(doc)}
                        </div>
                      </div>
                      <div className="text-[#bdbdbd] text-sm mt-1 truncate">
                        {getExhibitGeneralStateText(doc)}
                      </div>
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
              {selMDocId &&
                uploadingFiles.get(DocType.EXHIBIT)?.map((file, i) => (
                  <div key={i} className="flex py-4 border-t">
                    <div className="w-20 pl-6">{getEDocs().length + i + 1}</div>
                    <div className="flex-1 text-[#0550b3] truncate">
                      <div className="truncate flex items-center gap-2">
                        <div className="truncate underline">{file.name}</div>
                        <div className="pr-9 flex-1">
                          {getUploadingStateBadge(uploadingStates[i])}
                        </div>
                      </div>
                      <div className="text-[#bdbdbd] text-sm mt-1 truncate">
                        {uploadingStates[i] === UploadingState.DOING
                          ? "Document is currently uploading..."
                          : "Document is successfully uploaded"}
                      </div>
                    </div>
                  </div>
                ))}
              {selMDocId &&
              getEDocs().length == 0 &&
              !uploadingFiles.get(DocType.EXHIBIT) ? (
                <EmptyDropzone
                  handleUploadFile={(files) =>
                    handleUploadFile(
                      files,
                      DocType.EXHIBIT,
                      selMDocId ?? DocType.EXHIBIT
                    )
                  }
                  label="Exhibit List is Empty"
                />
              ) : (
                selMDocId && (
                  <Dropzone
                    p={0}
                    multiple
                    radius="xl"
                    maxSize={30 * 1024 ** 2}
                    onDrop={(files) =>
                      handleUploadFile(files, DocType.EXHIBIT, selMDocId)
                    }
                    accept={["application/pdf"]}
                    className="flex-1 rounded-none flex items-center justify-center border-0"
                  >
                    <div className="flex justify-center items-center cursor-pointer h-full flex-col py-10">
                      <IconUpload size={40} color="black" />
                      <div className="text-base text-black mt-3">
                        Upload Exhibits
                      </div>
                      <div className="text-[#7c7c7c] text-center px-4">
                        Drag your exhibit documents into this box
                      </div>
                    </div>
                  </Dropzone>
                )
              )}
              {!selMDocId && (
                <div className="flex-1 rounded-none flex items-center justify-center">
                  <div className="flex justify-center items-center h-full flex-col py-10">
                    <IconClick size={60} color="black" stroke={1} />
                    <div className="text-[#7c7c7c] text-center mt-4">
                      Click a document to see the Exhibits it cites
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* <div className={`rounded-xl border  ${panelsCss.Document}`}>
              <DecriptionPanel
                citedInMainDocuments={getCitedInMainDocuments(
                  selEDocId as string
                )}
              />
            </div> */}
          </div>
        </div>
      </div>

      <UploadExhibitModal
        opened={uploadModalOpened}
        close={closeUploadModal}
        open={openUploadModal}
        documents={documents}
        caseTitle={caseData?.data?.title ?? ""}
        mainDocumentId={selMDocId ?? ""}
        handleUploadFile={handleUploadFile}
      />
      <Modal size={"70%"} onClose={closeModal} opened={isModalOpen}>
        <PdfViewer mediaUrl={selectedDoc?.mediaUrl} />
      </Modal>
    </BaseLayout>
  );
};

export default CaseEditPage;
