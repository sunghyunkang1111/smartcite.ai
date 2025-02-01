"use client";
import { Button, MantineProvider, createTheme } from "@mantine/core";
import Link from "next/link";
import { IconArrowNarrowLeft, IconCheck } from "@tabler/icons-react";

export default function AuthenticationForm() {
  const theme = createTheme({});
  return (
    <MantineProvider theme={theme}>
      <div className="h-screen w-full flex items-center justify-center bg-[#fafafa]">
        <div className="w-[480px] py-10 flex flex-col p-8 bg-white rounded-lg justify-center items-center">
          <div className="bg-[#4bae4f] rounded-full w-14 h-14 flex items-center justify-center">
            <IconCheck color="white" size={32} stroke={6} />
          </div>
          <div className="font-bold text-xl text-black mt-6">
            Congratulations! Your Account is Ready
          </div>
          <div className="text-sm text-slate-500 mt-3 mb-8">
            Sign-up complete! Start managing your cases now.
          </div>
          <Button
            variant="default"
            component={Link}
            href="/auth/login"
            leftSection={<IconArrowNarrowLeft size={14} />}
            className="rounded-lg border-black"
          >
            Back to sign in
          </Button>
        </div>
      </div>
    </MantineProvider>
  );
}
