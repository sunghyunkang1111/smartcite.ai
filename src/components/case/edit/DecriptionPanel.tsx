import { IDocument } from "@/types/types";
import Link from "next/link";

const DecriptionPanel = ({
  citedInMainDocuments,
}: {
  citedInMainDocuments: IDocument[];
}) => {
  return (
    <>
      <div className="border-b flex items-center py-3 text-black px-4">
        Description
      </div>
      <div className="p-3 text-[#292929] leading-6">
        Document summary is being generated...
      </div>
      <div className="flex flex-col gap-4 p-3">
        <div className="">Also cited in:</div>
        {citedInMainDocuments.map((doc) => (
          <div key={doc.id}>
            <Link
              href={`/documents?caseId=${doc.caseId}&documentId=${doc.id}`}
              className="underline text-[#0550b3]"
            >
              {doc.title}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
};

export default DecriptionPanel;
