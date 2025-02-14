import { Dropzone } from "@mantine/dropzone";
import { IconFaceIdError } from "@tabler/icons-react";

interface EmptyDropzoneProps {
  handleUploadFile: (files: File[]) => void;
  label: string;
}

const EmptyDropzone = ({ handleUploadFile, label }: EmptyDropzoneProps) => {
  return (
    <>
      <Dropzone
        p={0}
        multiple
        radius="xl"
        maxSize={30 * 1024 ** 2}
        onDrop={(files) => handleUploadFile(files)}
        accept={["application/pdf"]}
        className="flex-1 rounded-none flex items-center justify-center"
      >
        <div className="flex justify-center items-center cursor-pointer h-full flex-col py-10">
          <IconFaceIdError size={60} color="black" />
          <div className="text-base text-black mt-3">{label}</div>
          <div className="text-[#7c7c7c] text-center">
            Drag your file into this box or click &quot;Upload Document&quot; to get
            started
          </div>
        </div>
      </Dropzone>
    </>
  );
};

export default EmptyDropzone;
