"use client";

import React, { PropsWithChildren } from "react";
import { Layout as BaseLayout } from "@/components/layout";
import "react-phone-input-2/lib/style.css";
import { usePathname } from "next/navigation";
import Link from "next/link";

export const SettingLayout = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();
  const page = pathname.split("/").pop() || "profile";
  const menuData = [
    {
      id: 1,
      url: "profile",
      label: "Profile",
    },
    {
      id: 2,
      url: "teams",
      label: "Teams",
    },
    {
      id: 3,
      url: "api-keys",
      label: "Api-Keys",
    },
  ];

  return (
    <BaseLayout>
      <div className="p-6">
        <div className="text-xl text-[#292929] font-semibold pb-6">
          Settings
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col gap-2 w-64">
            {menuData.map((item) => (
              <Link
                key={item.label}
                href={`/settings/${item.url}`}
                className={`text-base text-[#292929] cursor-pointer border-b-2 hover:border-[#292929] px-4 py-2.5 duration-100 ${
                  page === item.url
                    ? "font-semibold border-[#292929]"
                    : "border-transparent"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="w-full">{children}</div>
        </div>
      </div>
    </BaseLayout>
  );
};
