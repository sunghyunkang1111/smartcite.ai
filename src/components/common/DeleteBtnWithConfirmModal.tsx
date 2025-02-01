import { ReactNode, useState } from "react";
import { Modal, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

type DeleteConfirmModalProps = {
  onDelete: () => void;
  trigger: ReactNode;
};

const DeleteConfirmModal = ({ onDelete, trigger }: DeleteConfirmModalProps) => {
  const [opened, setOpened] = useState(false);

  const handleConfirm = () => {
    onDelete();
    setOpened(false);
  };

  return (
    <>
      {/* Button to trigger the modal */}
      <span onClick={() => setOpened(true)}>{trigger}</span>
      {/* Confirmation Modal */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title=""
        centered
        withCloseButton={false}
        size="450px"
        styles={{
          title: {
            color: "black",
          },
        }}
      >
        <Text size="md" className="text-gray-700">
          Notification
        </Text>
        <div className="w-full flex flex-col items-center justify-center gap-2">
          <div className="bg-[#e73b3b] rounded-full w-10 h-10 flex items-center justify-center">
            <IconTrash color="white" />
          </div>
          <div className="text-center text-black text-base font-medium">
            Are you sure you want to delete this item?
          </div>
          <div className="text-center text-[#7c7c7c] text-sm">
            All associated data will be permanently removed and unrecoverable?
          </div>
        </div>
        <div className="flex mt-4 space-x-2 text-sm">
          <button
            className="flex-1 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 border border-black"
            onClick={() => setOpened(false)}
          >
            Cancel
          </button>
          <button
            className="flex-1 bg-red-500 text-white py-1 px-4 rounded-lg hover:bg-red-600"
            onClick={handleConfirm}
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
};

export default DeleteConfirmModal;
