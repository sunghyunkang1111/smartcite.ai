import { IconNotes, IconPaperclip, IconScale } from "@tabler/icons-react";

// src/utils/menuData.ts
export const menuItems = [
  {
    key: "cases",
    icon: <IconScale />,
    label: "Matter Management",
    route: "/cases/edit",
  },
  {
    key: "documents",
    icon: <IconNotes />,
    label: "Citing Documents",
    route: "/documents",
  },
  {
    key: "exhibits",
    icon: <IconPaperclip />,
    label: "Exhibit Library",
    route: "/exhibits",
  },
  // Add more items as needed
];
