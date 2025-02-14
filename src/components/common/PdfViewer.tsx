import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ActionIcon, LoadingOverlay, Tooltip } from "@mantine/core";
import { searchPlugin } from "@react-pdf-viewer/search";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";

const Viewer = dynamic(
  () => import("@react-pdf-viewer/core").then((mod) => mod.Viewer),
  {
    ssr: false,
  }
);

const Worker = dynamic(
  () => import("@react-pdf-viewer/core").then((mod) => mod.Worker),
  {
    ssr: false,
  }
);

interface PdfViewerProps {
  mediaUrl?: string;
  highlightWords?: string[];
}

const PdfViewer = ({ mediaUrl, highlightWords = [] }: PdfViewerProps) => {
  const searchPluginInstance = searchPlugin();
  const { highlight, jumpToMatch, jumpToNextMatch, jumpToPreviousMatch } =
    searchPluginInstance;

  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [highlightingDone, setHighlightingDone] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setUserScrolled(true);
    document.addEventListener("scroll", handleScroll, true);
    return () => document.removeEventListener("scroll", handleScroll, true);
  }, []);

  useEffect(() => {
    if (!pdfLoaded || highlightWords.length === 0) return;

    setHighlightingDone(false);

    const highlightAllWords = async () => {
      const highLightedWords = highlightWords.map((word) => {
        return {
          keyword: word,
          matchCase: false,
          wholeWords: false,
        };
      });
      console.log(highLightedWords);
      highlight(highLightedWords);

      setTimeout(() => {
        if (!userScrolled) {
          jumpToMatch(0);
        }
        setHighlightingDone(true);
      }, 500);
    };

    const timer = setTimeout(highlightAllWords, 1000);

    return () => clearTimeout(timer);
  }, [highlightWords, pdfLoaded]);

  const handleNextCitation = () => {
    const response = jumpToNextMatch();
    console.log(response);
  };

  const handlePreviousCitation = () => {
    const response = jumpToPreviousMatch();
    console.log(response);
  };

  return (
    <div
      className="rounded-lg"
      style={{
        height: "100%",
        width: "100%",
        maxWidth: "1000px",
        maxHeight: "calc(100vh - 40px)",
        overflowY: "auto",
        margin: "0 auto",
      }}
    >
      {highlightWords.length > 1 && (
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          <Tooltip label="Previous Citation">
            <ActionIcon
              variant="filled"
              color="blue"
              onClick={handlePreviousCitation}
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={`Next Citation`}>
            <ActionIcon
              variant="filled"
              color="blue"
              onClick={handleNextCitation}
            >
              <IconArrowRight size={18} />
            </ActionIcon>
          </Tooltip>
        </div>
      )}
      {mediaUrl && (
        <Worker workerUrl="/pdf.worker.min.js">
          <Viewer
            fileUrl={mediaUrl}
            plugins={[searchPluginInstance]}
            onDocumentLoad={() => {
              setPdfLoaded(true);
              setUserScrolled(false);
            }}
            renderLoader={() => (
              <LoadingOverlay
                visible={!highlightingDone || !pdfLoaded}
                zIndex={1000}
                loaderProps={{ color: "black", type: "bars" }}
              />
            )}
          />
        </Worker>
      )}
    </div>
  );
};

export default PdfViewer;
