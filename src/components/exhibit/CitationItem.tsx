import { IconEye, IconEyeOff } from "@tabler/icons-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface Citation {
  doc: any;
  sourceTexts: string[];
}

interface CitationsListProps {
  citation: Citation;
}

export default function CitationItem({ citation }: CitationsListProps) {
  const [opened, setOpened] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [shouldShowControls, setShouldShowControls] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setShouldShowControls(contentRef.current.scrollHeight > 70);
    }
  }, [citation]);
  return (
    <div key={citation.doc.id} className="text-xs mb-2 grid grid-cols-2 gap-4">
      <Link
        href={`/documents?caseId=${citation.doc.caseId}&documentId=${citation.doc.id}`}
        className="flex"
      >
        <div className="underline text-[#056cf3] break-all">
          {citation.doc.title}
        </div>{" "}
      </Link>
      <div className="relative flex gap-2">
        <div className="text-[#989898] ml-2">as</div>
        <div
          ref={contentRef}
          className={`text-[#989898] text-sm italic ${
            opened ? "max-h-[1000px]" : "max-h-[70px]"
          } overflow-y-hidden transition-[max-height] duration-300 ease-in-out flex flex-col gap-1 max-w-[150px]`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {citation.sourceTexts.map((text, i) => (
            <div key={i} className="break-all">
              {text},
            </div>
          ))}
          {!opened && shouldShowControls && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          )}
          {hovered && shouldShowControls && (
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center border bg-white hover:text-black h-8 w-8 rounded-full hover:border-black duration-300`}
              onClick={(e) => {
                e.stopPropagation();
                setOpened(!opened);
              }}
            >
              {opened ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
