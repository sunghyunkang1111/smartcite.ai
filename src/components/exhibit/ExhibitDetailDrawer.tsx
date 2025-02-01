// import dynamic from "next/dynamic";
// const PdfViewer = dynamic(() => import("@/components/common/PdfViewer"), {
//   ssr: false,
// });
import { Drawer, LoadingOverlay } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import PdfHighlighter from "@components/common/pdfHighlighter";
interface ExhibitDetailDrawerProps {
  opened: boolean;
  close: () => void;
  selExh: any;
  cases: any[];
}

const ExhibitDetailDrawer = ({
  opened,
  close,
  selExh,
  cases,
}: ExhibitDetailDrawerProps) => {
  return (
    <>
      <Drawer
        opened={opened}
        onClose={close}
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
          visible={false}
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
            Exhibit Detail
          </div>
        </div>
        <div className="mt-4 text-[#292929]">
          Case Title:{" "}
          <Link
            href={`/cases?caseId=${selExh?.caseId}`}
            className="text-[#056cf3] underline"
          >
            {cases[0]?.title}
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-11 text-sm flex-1 gap-4">
          <div className="col-span-5 border rounded-xl relative">
            <div className="flex items-center py-3 pl-4 border-b text-[#292929]">
              Description
            </div>
            <div className="p-4">
              <div className="text-[#056cf3] underline">{selExh?.title}</div>
              <div className="#292929 mt-3 leading-6">
                Document summary is being generated...
              </div>
              <div className="text-[#292929] mt-4">Cited in</div>
              {selExh?.citedInMainDocuments.map((citedInMainDocument: any) => (
                <div
                  className="flex justify-between mt-4 gap-4"
                  key={citedInMainDocument.id}
                >
                  <Link
                    href={`/documents?caseId=${citedInMainDocument.doc.caseId}&documentId=${citedInMainDocument.doc.id}`}
                    className="text-[#056cf3] underline"
                    key={citedInMainDocument.id}
                  >
                    {citedInMainDocument.doc.title}
                  </Link>
                  <div className="text-[#989898] truncate line-clamp-1">
                    as {citedInMainDocument.sourceText}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-6 border border-2 border-[#eeeff1] relative py-6  bg-[#eeeff1] rounded-xl">
            {/* {selExh?.mediaUrl && <PdfViewer mediaUrl={selExh.mediaUrl} />} */}
            {selExh?.mediaUrl && <PdfHighlighter mediaUrl={selExh.mediaUrl} />}

          </div>
        </div>
      </Drawer>
    </>
  );
};

export default ExhibitDetailDrawer;
