"use client";

import { useEffect, type PropsWithChildren } from "react";
import { Sidebar } from "../sidebar";
import { useIsAuthenticated } from "@refinedev/core";
import {
  MantineProvider,
  createTheme,
} from "@mantine/core";
import { redirect } from "next/navigation";
export const Layout = ({ children }: PropsWithChildren) => {
  
  const { data } = useIsAuthenticated();

  useEffect(() => {
    if (data) {
      if (!data.authenticated) {
        redirect("/auth/login");
      }
    }
  }, [data]);
  const theme = createTheme({
    /** Put your mantine theme override here */
    components: {
      Button: {
        styles: () => ({
          root: {
            fontWeight: "normal", // Set button font weight to normal
          },
        }),
      },
      InputWrapper: {
        styles: () => ({
          description: {
            color: "#000",
            paddingBottom: 4,
          },
        }),
      },
      Input: {
        styles: () => ({
          input: {
            backgroundColor: "transparent", // Set your desired background color here
          },
        }),
      },
      Table: {
        styles: () => ({
          td: {
            fontSize: "14px",
          },
          th: {
            fontSize: "14px",
            color: "#989898",
            fontWeight: "normal",
          },
        }),
      },
    },
  });
  return (
    <MantineProvider theme={theme}>
      <div className="flex h-screen">
        <Sidebar />
        <div className="w-full h-screen flex flex-col pl-[260px]">
          <div className="flex-1 relative">{children}</div>
        </div>
      </div>
    </MantineProvider>
  );
};
