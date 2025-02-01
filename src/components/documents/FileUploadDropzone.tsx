import { Dropzone } from "@mantine/dropzone";
import React from "react"; // Import React
import { useForm } from "@mantine/form";
import { Group, rem, useMantineTheme } from "@mantine/core";
import { IconCloudUpload, IconDownload, IconX } from "@tabler/icons-react";
interface ComponentProps {
  handleFileChange: (files: File[]) => void;
  singleFile?: boolean;
}

interface FormValues {
  files: File[];
}

const FileUploadDropzone: React.FC<ComponentProps> = ({
  handleFileChange,
  singleFile = false,
}) => {
  const theme = useMantineTheme();
  const form = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: { files: [] },
  });
  return (
    <div className="relative">
      <Dropzone
        p={0}
        multiple={!singleFile}
        radius="md"
        maxSize={30 * 1024 ** 2}
        onDrop={(files) => handleFileChange(files)} // Ensure handleFileChange is passed as a prop
        accept={["application/pdf"]}
        onReject={() => form.setFieldError("files", "Select pdfs only")}
      >
        <div className="py-4 cursor-pointer">
          <div className="">
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
          <div className="text-center text-[#989898]">
            Drop, drag files here, or{" "}
            <span className="text-black underline">Browse</span>
          </div>
        </div>
      </Dropzone>
    </div>
  );
};

export default FileUploadDropzone;
