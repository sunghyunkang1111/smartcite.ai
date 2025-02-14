import CitationItem from "./CitationItem";

interface Citation {
  doc: any;
  sourceTexts: string[];
}

interface CitationsListProps {
  citations: Citation[];
}

export default function CitationsList({ citations }: CitationsListProps) {

  return (
    <div>
      {citations.map((citation) => (
        <CitationItem key={citation.doc.id} citation={citation} />
      ))}
    </div>
  );
}
