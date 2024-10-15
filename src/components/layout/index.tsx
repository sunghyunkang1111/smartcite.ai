"use client";

import type { PropsWithChildren } from "react";
import { Sidebar } from "../sidebar";
import { useGetIdentity, useLogout } from "@refinedev/core";
export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  const { mutate: logout } = useLogout();
  return (
    <div className="flex">
      <Sidebar />
      <div className="w-full">
        <div className="h-16 flex justify-end">
          <div
            onClick={() => logout()}
            className="flex items-center px-6 gap-2"
          >
            <div className="text-sm">example@adminjs.co</div>
            <div className="w-9 h-9 flex items-center justify-center bg-[#3040d6] text-white rounded-full text-base">
              E
            </div>
          </div>
        </div>
        <div className="bg-[#f8f9f9]">{children}</div>
      </div>
    </div>
  );
};
