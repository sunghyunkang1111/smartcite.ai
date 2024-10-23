"use client";

import { useGetIdentity, useLogout, useMenu, useOne } from "@refinedev/core";
import { usePathname, useSearchParams } from "next/navigation";
import { dashboardMenuItems, menuItems } from "@utils/menuData";
import Link from "next/link";
import { IconBriefcase, IconCircle } from "@tabler/icons-react";

export const Sidebar = () => {
  // const { menuItems, selectedKey } = useMenu();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const caseId = searchParams.get("caseId");
  const { data: caseData, isLoading: caseLoading } = useOne<any>({
    resource: "cases",
    id: caseId as string,
  });
  const selectedKey = pathname.split("/")[1].split("?")[0];
  const menus = selectedKey == "dashboard" ? dashboardMenuItems : menuItems;
  return (
    <div className="border-r border-[#eeeeef]">
      <nav className="w-[250px]">
        <div className="px-4 py-3 flex items-end text-3xl font-bold text-black">
          <span className="text-[#3040d6] text-4xl">S</span>
          martcite
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-3 flex items-center gap-2 text-md text-black cursor-pointer"
        >
          <IconBriefcase size={14} /> Matters
        </Link>
        {caseId && (
          <Link
            href={`/documents?caseId=${caseId}`}
            className="px-4 py-3 flex items-center gap-2 text-md text-black cursor-pointer"
          >
            <IconCircle size={14} />
            {caseData?.data?.title}
          </Link>
        )}
        <div className="flex flex-col gap-2 w-full">
          {menus.map((item) => (
            <Link
              key={item.key}
              href={item.route + `?caseId=${caseId}`}
              className={`w-full px-9 py-3 no-underline hover:bg-[#f0f0f0] hover:text-[#0c1e29] duration-500 text-sm ${
                selectedKey === item.key
                  ? "bg-[#d6d9f7] text-[#3040d6] font-medium"
                  : "text-[#0c1e29]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};
