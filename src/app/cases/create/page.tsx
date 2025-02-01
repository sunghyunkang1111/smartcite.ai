"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  MultiSelect,
  Select as MantineSelect,
  TextInput,
  LoadingOverlay,
  Menu,
  Loader,
} from "@mantine/core";
import { useGetIdentity, useNavigation } from "@refinedev/core";
import Link from "next/link";
import { Layout as BaseLayout } from "@/components/layout";
import {
  IconArrowLeft,
  IconCheck,
  IconClick,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import {
  getUsersOfOrganization,
  getUserOrganization,
} from "@/services/keycloak/user.service";
import {
  CaseStates,
  CaseStateTextColor,
  ClientRoles,
  DocType,
} from "@/utils/util.constants";
import { notification, Select } from "antd";
import { IDocument } from "@/types/types";
import {
  uploadFile,
  getMediaPresignedUrl,
} from "@services/admin-file-upload.service";
import { useDisclosure } from "@mantine/hooks";
import DeleteConfirmModal from "@components/common/DeleteBtnWithConfirmModal";
import EmptyDropzone from "@components/case/edit/EmptyDropzone";
import { Dropzone } from "@mantine/dropzone";
import { createDocument } from "@services/document.service";
import { v4 as uuidv4 } from "uuid";
import { createCase } from "@services/case.service";
import UploadExhibitModal from "@components/case/UploadExhibitModal";

// Constants
const UploadingState = {
  DOING: "DOING",
  SUCCESS: "SUCCESS",
  FAIL: "FAIL",
};

const PANEL_CONFIGS = {
  noDocuments: {
    Main: "col-span-12",
    Exhibit: "hidden",
    Document: "hidden",
  },
  mainDocSelected: {
    Main: "col-span-3",
    Exhibit: "flex flex-col col-span-4",
    Document: "block col-span-5",
  },
  mainDocOnly: {
    Main: "col-span-5",
    Exhibit: "flex flex-col col-span-7",
    Document: "hidden",
  },
};

// Types
interface FormValues {
  title: string;
  client: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

// Component
export default function CreateCase() {
  // Hooks
  const { push } = useNavigation();
  const { data: userData, isLoading: userLoading } = useGetIdentity<any>();
  const [
    uploadModalOpened,
    { open: openUploadModal, close: closeUploadModal },
  ] = useDisclosure(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [caseId, setCaseId] = useState<string>(uuidv4());
  const [users, setUsers] = useState<User[]>([]);
  const [panelsCss, setPanelsCss] = useState(PANEL_CONFIGS.noDocuments);
  const [selMDocId, setSelMDocId] = useState<string>();
  const [matterState, setMatterState] = useState<string>(CaseStates[0]);
  const [assignedLawyers, setAssignedLawyers] = useState<string[]>([]);
  const [clientRole, setClientRole] = useState(ClientRoles[0]);
  const [assignedLawyerOptions, setAssignedLawyerOptions] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, File[]>>(
    new Map()
  );
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadingStates, setUploadingStates] = useState<string[]>([]);

  // Form
  const form = useForm<FormValues>({
    initialValues: {
      title: "",
      client: "",
    },
    validate: {
      title: (value) => {
        if (!value) return "Title is required";
        if (!value.match(/^[A-Za-z][A-Za-z0-9/ ]*$/)) {
          return "Title must start with a letter and can only contain letters, numbers, spaces, and forward slashes";
        }
        return null;
      },
      client: (value) => (!value ? "Client is required" : null),
    },
  });

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

  // Event handlers
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.validate().hasErrors) return;

    setIsLoading(true);
    try {
      const createdCase = await createCase(
        form.values.title,
        form.values.client,
        clientRole,
        assignedLawyers.join(","),
        matterState
      );

      if (!createdCase) throw new Error("Failed to create case");

      setCaseId(createdCase.id);
      
      for (const doc of getMDocs()) {
        const createdMainDocument = await createDocument(
          createdCase.id,
          doc.mediaId,
          doc.title,
          doc.type,
          doc.type
        );
        if (!createdMainDocument)
          throw new Error("Failed to create main document");

        for (const exhibitDocument of documents.filter(
          (ed) => ed.mainDocumentId == doc.id
        )) {
          const createdExhibitDocument = await createDocument(
            createdCase.id,
            exhibitDocument.mediaId,
            exhibitDocument.title,
            exhibitDocument.type,
            createdMainDocument.id
          );
          if (!createdExhibitDocument)
            throw new Error("Failed to create exhibit document");
        }
      }
      notification.success({
        message: "Success",
        description: "Case created successfully",
      });
      
      push("/cases/edit?caseId="+ createdCase.id);
    } catch (error) {
      console.error(error);
      notification.error({
        message: "Error",
        description: "Failed to create case",
      });
      // push("/cases");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFile = async (
    fs: File[],
    dockType: string,
    mainDocId: string
  ) => {
    const newDocuments: any[] = [];
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

        const createdDocument = {
          id: uuidv4(),
          type: dockType,
          title: file.name,
          mainDocumentId: mainDocId,
          mediaId: presignedUrl.id,
          userId: userData?.sub,
          caseId,
        };

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
    doc.type === DocType.MAIN && setSelMDocId(undefined);
    setDocuments(documents.filter((d) => d.id !== doc.id));
  };

  // Effects
  useEffect(() => {
    if (!userData) return;
    setAssignedLawyerOptions([{ value: userData?.sub, label: userData?.name }]);
    if (users.length > 0) {
      setAssignedLawyerOptions(
        users.map((user) => ({
          value: user.id,
          label: `${user.firstName} ${user.lastName}`,
        }))
      );
    }
  }, [userData, users]);

  useEffect(() => {
    if (!userData) return;
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const userOrganizations = await getUserOrganization(
          userData?.sub as string
        );
        const response = await getUsersOfOrganization(userOrganizations[0].id);
        setUsers(response);
      } catch (error) {
        console.error("Error fetching users:", error);
        notification.error({
          message: "Error",
          description: "Failed to fetch data",
        });
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [userData]);

  useEffect(() => {
    const hasMainDocs = getMDocs().length > 0;
    if (!hasMainDocs) {
      setPanelsCss(PANEL_CONFIGS.noDocuments);
    } else if (selMDocId) {
      setPanelsCss(PANEL_CONFIGS.mainDocOnly);
    } else {
      setPanelsCss(PANEL_CONFIGS.mainDocOnly);
    }
  }, [selMDocId, documents]);

  // Render helpers
  const renderFormField = (
    label: string,
    name: keyof FormValues,
    placeholder: string
  ) => (
    <TextInput
      required
      label={label}
      placeholder={placeholder}
      value={form.values[name]}
      onChange={(event) => form.setFieldValue(name, event.currentTarget.value)}
      error={form.errors[name]}
      radius="sm"
      labelProps={{
        style: { color: "black", marginBottom: "6px" },
      }}
    />
  );

  const commonInputStyles = {
    input: { backgroundColor: "white" },
    label: { color: "black", marginBottom: "6px" },
  };

  // JSX
  return (
    <BaseLayout>
      <LoadingOverlay
        visible={isLoading || usersLoading || userLoading}
        zIndex={1000}
        loaderProps={{ color: "black", type: "bars" }}
      />
      <div className="p-6 min-h-screen flex flex-col">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/cases"
                className="border rounded-lg p-1.5 border-[#292929]"
              >
                <IconArrowLeft color="#292929" size={24} />
              </Link>
              <div className="text-xl text-[#292929]">Untitled Matter</div>
            </div>
            <div className="flex gap-2">
              <Select
                onChange={setMatterState}
                style={{ width: "120px", height: "100%" }}
                value={matterState}
              >
                {CaseStates.map((state) => (
                  <Select.Option key={state} value={state}>
                    <span style={{ color: CaseStateTextColor[state] }}>
                      {state}
                    </span>
                  </Select.Option>
                ))}
              </Select>
              <Button
                variant="default"
                color="dark.6"
                style={{ borderColor: "black", backgroundColor: "white" }}
                component={Link}
                href="/cases"
              >
                Cancel
              </Button>
              <Button variant="" color="dark.6" type="submit">
                Save
              </Button>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 mt-6">
            <div className="text-xl text-[#292929]">General Information</div>
            <div className="mt-3">
              <div className="grid grid-cols-2 gap-4">
                {renderFormField("Title", "title", "Enter title here")}
                {renderFormField("Client", "client", "Enter client here")}
                <MantineSelect
                  label="Client Role"
                  placeholder="Client Role"
                  defaultValue={"Petitioner"}
                  required
                  value={clientRole}
                  onChange={(value) => setClientRole(value as string)}
                  data={ClientRoles}
                  styles={commonInputStyles}
                />
                <MultiSelect
                  label="Assigned Lawyer"
                  required
                  placeholder="Assigned Lawyer"
                  data={assignedLawyerOptions}
                  value={assignedLawyers}
                  onChange={setAssignedLawyers}
                  styles={commonInputStyles}
                />
              </div>
            </div>
          </div>
        </form>
        {/* <div className="bg-white rounded-lg p-4 mt-6 flex flex-col flex-1 relative">
          <LoadingOverlay
            visible={loading}
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
              <Menu shadow="md" width={200}>
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
                  <Menu.Item onClick={() => fileInputRef.current?.click()}>
                    Upload main documents
                  </Menu.Item>
                  <Menu.Item onClick={openUploadModal} disabled={!selMDocId}>
                    Upload exhibit
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          </div>
          <div className="grid grid-cols-12 text-sm gap-1 flex-1 pt-6 text-[#989898]">
            <div
              className={`rounded-xl border flex flex-col ${panelsCss.Main}`}
            >
              <div className="flex items-center py-3">
                <div className="w-10 pl-3">#</div>
                <div className="flex-1">Document Name</div>
                <div className="w-20 text-center">Actions</div>
              </div>
              {getMDocs().map((doc, _i) => (
                <div
                  key={doc.id}
                  onClick={() => setSelMDocId(doc.id)}
                  className={`flex py-4 cursor-pointer border-t ${getSelDocCss(
                    doc.id == selMDocId
                  )}`}
                >
                  <div className="w-10 pl-3">{_i + 1}</div>
                  <div className="flex-1 text-[#0550b3] truncate">
                    <div className="truncate flex items-center gap-2">
                      <div className="truncate underline">{doc.title}</div>
                    </div>
                  </div>
                  <div className="w-20" onClick={(e) => e.stopPropagation()}>
                    <DeleteConfirmModal
                      onDelete={() => handleDeleteDocument(doc)}
                      trigger={
                        <div className="cursor-pointer flex justify-center text-[#989898] hover:text-[#2e2e2e]">
                          <IconTrash size={20} />
                        </div>
                      }
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
                      Upload Document
                    </div>
                    <div className="text-[#7c7c7c] text-center px-4">
                      Drag your file into this box or click &quot;Upload
                      Document&quot; to get started
                    </div>
                  </div>
                </Dropzone>
              )}
            </div>
            <div className={`rounded-xl border ${panelsCss.Exhibit}`}>
              <div className="flex items-center py-3">
                <div className="w-20 pl-6">#</div>
                <div className="flex-1">Exhibits Name</div>
                <div className="w-20 text-center">Actions</div>
              </div>
              {selMDocId &&
                getEDocs().map((doc, _i) => (
                  <div
                    key={doc.id}
                    className={`flex items-center py-4 cursor-pointer border-t}`}
                  >
                    <div className="w-20 pl-6">{_i + 1}</div>
                    <div className="flex-1 text-[#0550b3] truncate flex items-center gap-2">
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
                        Upload Document
                      </div>
                      <div className="text-[#7c7c7c] text-center px-4">
                        Drag your file into this box or click &quot;Upload
                        Document&quot; to get started
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
          </div>
        </div> */}
      </div>
      <UploadExhibitModal
        opened={uploadModalOpened}
        close={closeUploadModal}
        open={openUploadModal}
        documents={documents}
        caseTitle="New Case"
        mainDocumentId={selMDocId ?? ""}
        handleUploadFile={handleUploadFile}
      />
    </BaseLayout>
  );
}
