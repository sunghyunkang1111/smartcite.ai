/* eslint-disable no-unused-vars */
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LoadingOverlay } from "@mantine/core";
import { searchPlugin, FlagKeyword } from "@react-pdf-viewer/search";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";

const Viewer = dynamic(() => import("@react-pdf-viewer/core").then((mod) => mod.Viewer), {
  ssr: false,
});

const Worker = dynamic(() => import("@react-pdf-viewer/core").then((mod) => mod.Worker), {
  ssr: false,
});

interface PdfHighlighterProps {
  mediaUrl?: string;
}

const PdfHighlighter = ({ mediaUrl }: PdfHighlighterProps) => {
  const [currentKeyword, setCurrentKeyword] = useState<FlagKeyword>({
    keyword: "Education",
    matchCase: false,
    wholeWords: false,
  });

  const searchPluginInstance = searchPlugin();
  const { highlight } = searchPluginInstance;

  useEffect(() => {
    const timer = setTimeout(() => {
      highlight(currentKeyword);
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentKeyword, highlight]);

  return (
    <div className="rounded-lg bg-gray-100 p-4">
      {mediaUrl && (
        <Worker workerUrl="/pdf.worker.min.js">
          <div className="relative w-full h-[80vh] border border-gray-300 rounded-lg overflow-hidden">
            <Viewer
              fileUrl={mediaUrl}
              plugins={[searchPluginInstance]}
              renderLoader={() => (
                <LoadingOverlay
                  visible={true}
                  zIndex={1000}
                  loaderProps={{ color: "black", type: "bars" }}
                />
              )}
            />
          </div>
        </Worker>
      )}
    </div>
  );
};

export default PdfHighlighter;