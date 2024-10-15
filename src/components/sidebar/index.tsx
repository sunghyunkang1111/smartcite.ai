"use client";

import { useGetIdentity, useLogout, useMenu } from "@refinedev/core";
import Link from "next/link";

export const Sidebar = () => {
  const { menuItems, selectedKey } = useMenu();
  return (
    <div>
      <nav className="w-[300px]">
        <div className="p-8 flex items-center justify-center">
          <img src="https://demo.adminjs.co/images/logo.svg" alt="Refine" />
        </div>
        <div className="flex flex-col gap-2 px-6 py-4 w-full">
          {menuItems.map((item) => (
            <Link
              key={item.key}
              href={item.route ?? "/"}
              className={`w-full px-4 py-2 rounded-md no-underline hover:bg-[#f0f0f0] hover:text-[#0c1e29] duration-500 text-sm ${
                selectedKey === item.key ? "bg-[#d6d9f7] text-[#3040d6] font-semibold" : "text-[#0c1e29]"
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
