import { Dropzone } from "@mantine/dropzone";
import React, { useEffect, useState } from "react"; // Import React
import { useForm } from "@mantine/form";
import { Group, rem, useMantineTheme } from "@mantine/core";
import { IconCloudUpload, IconDownload, IconX } from "@tabler/icons-react";
interface ComponentProps {
  handleFileChange: (files: File[]) => void;
}

interface FormValues {
  files: File[];
}

const FileUploadDropzone: React.FC<ComponentProps> = ({ handleFileChange }) => {
  const theme = useMantineTheme();
  const form = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: { files: [] },
  });
  return (
    <div className="relative">
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
  );
};

export default FileUploadDropzone;
