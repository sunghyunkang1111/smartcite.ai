"use client";
import { MantineProvider } from "@mantine/core";
import { useGetIdentity, useNavigation } from "@refinedev/core";
import React from "react";

export default function LoginLayout({
  children,
}: React.PropsWithChildren) {
  const { push } = useNavigation();

  const { data: identity } = useGetIdentity<any>();
  if (identity) {
    push("/cases");
  }
  return (
    <>
      <MantineProvider>{children}</MantineProvider>
    </>
  );
}