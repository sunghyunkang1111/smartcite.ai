"use client";

import type { PropsWithChildren } from "react";
import { Sidebar } from "../sidebar";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { InputWrapper, MantineProvider, TableTr, createTheme } from "@mantine/core";
export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  const { mutate: logout } = useLogout();
  const { data } = useGetIdentity();
  const user = data as any;
  const theme = createTheme({
    /** Put your mantine theme override here */
    components: {
      Button: {
        styles: (theme: any) => ({
          root: {
            fontWeight: 'normal', // Set button font weight to normal
          },
        }),
      },
      InputWrapper: {
        styles: (theme: any) => ({
          description: {
            color: '#000',
            paddingBottom: 4,
          },
        }),
      },
      Input: {
        styles: (theme: any) => ({
          input: {
            backgroundColor: 'transparent', // Set your desired background color here
          },
        }),
      },
      Table: {
        styles: (theme: any) => ({
          td: {
            backgroundColor: 'transparent', // Set your desired background color here
            fontSize: '14px'
          },
          th: {
            backgroundColor: '#f5f6f6', // Set your desired background color here
            fontSize: '12px'
          },
        }),
      }
    },
  });
  return (
    <MantineProvider theme={theme}>
      <div className="flex h-screen">
        <Sidebar />
        <div className="w-full h-screen flex flex-col">
          <div className="h-16 flex justify-end border-b border-[#eeeeef]">
            <div
              onClick={() => logout()}
              className="flex items-center px-6 gap-2"
            >
              <div className="text-sm">{user?.email}</div>
              <div className="w-9 h-9 flex items-center justify-center bg-[#3040d6] text-white rounded-full text-base">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
          <div className="bg-[#f8f9f9] flex-1">{children}</div>
        </div>
      </div>
    </MantineProvider>
  );
};
