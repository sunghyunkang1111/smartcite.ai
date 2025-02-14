"use client";
import { MantineProvider } from "@mantine/core";
import { useGetIdentity, useNavigation } from "@refinedev/core";
import React, { useEffect, useMemo, useRef } from "react";

export default function LoginLayout({
  children,
}: React.PropsWithChildren) {
  const { push } = useNavigation();
  const { data: identity } = useGetIdentity<any>();
  const prevIdentityRef = useRef(identity);


  useEffect(() => {
    console.log("🔄 Checking identity for redirect:", identity, "Previous:", prevIdentityRef.current);

    // Prevent unnecessary redirects if identity hasn't changed
    if (prevIdentityRef.current === identity) return;

    // Update previous identity reference
    prevIdentityRef.current = identity;

    if (identity) {
      console.log("🚀 RUNNING REDIRECT TO CASES PAGE");
      push("/cases");
    }
  }, [identity, push]);

  return (
    <>
      <MantineProvider>{children}</MantineProvider>
    </>
  );
}