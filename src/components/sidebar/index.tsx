"use client";

import { useGetIdentity, useLogout } from "@refinedev/core";
import { usePathname, useSearchParams } from "next/navigation";
import { menuItems } from "@/utils/menuData";
import Link from "next/link";
import { IconLogout, IconNotes, IconSettings } from "@tabler/icons-react";
import { Menu } from "@mantine/core";

export const Sidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const caseId = searchParams.get("caseId");
  const { mutate: logout } = useLogout();
  const { data } = useGetIdentity();
  const user = data as any;
  const selectedKey = pathname.split("/")[1].split("?")[0];
  const menus = menuItems;
  return (
    <nav className="w-[260px] fixed left-0 top-0 flex flex-col h-screen bg-white">
      <div className="p-6 flex items-center text-xl text-black">
        <span className="text-[#394149] font-bold ml-2">SMART</span>
        <span className="text-[#394149]">CITE</span>
      </div>
      <div className="flex flex-col gap-2 w-full flex-1">
        {caseId ? (
          menus.map((item) => (
            <Link
              key={item.key}
              href={item.route + `?caseId=${caseId}`}
              className={`px-3 py-3 mx-3 no-underline hover:bg-[#f0f0f0] rounded-lg hover:text-[#0c1e29] duration-500 text-md flex items-center gap-2 ${
                selectedKey === item.key
                  ? "bg-[#f4f4f4] text-[#292929] font-bold"
                  : "text-[#7c7c7c]"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))
        ) : (
          <Link
            href='/cases'
            className={`px-3 py-3 mx-3 no-underline hover:bg-[#f0f0f0] rounded-lg hover:text-[#0c1e29] duration-500 text-md flex items-center gap-2 ${
              selectedKey === "cases"
                ? "bg-[#f4f4f4] text-[#292929] font-bold"
                : "text-[#7c7c7c]"
            }`}
          >
            <IconNotes />
            Matters
          </Link>
        )}
      </div>
      <div className="">
        <Link
          href={`/settings/profile`}
          className={`px-3 py-3 mx-3 no-underline hover:bg-[#f0f0f0] rounded-lg hover:text-[#0c1e29] duration-500 text-md flex items-center gap-2 ${
            selectedKey === "settings"
              ? "bg-[#f4f4f4] text-[#292929] font-bold"
              : "text-[#7c7c7c]"
          }`}
        >
          <IconSettings />
          Settings
        </Link>
        <div className="h-16 flex border-b border-[#eeeeef]">
          <Menu position="right-end">
            <Menu.Target>
              <div className="w-full cursor-pointer">
                <div className="rounded-lg hover:bg-[#f0f0f0] duration-500 flex items-center mx-3 mb-1 px-3 py-2 gap-2">
                  <div className="w-9 h-9 flex items-center justify-center bg-[#394149] text-white rounded-full text-base">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm">{user?.email}</div>
                </div>
              </div>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                onClick={() => logout()}
                leftSection={<IconLogout size={14} />}
              >
                Sign out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>
    </nav>
  );
};
