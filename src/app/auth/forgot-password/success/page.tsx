"use client";
import { Button } from "@mantine/core";
import Link from "next/link";
import { IconArrowNarrowLeft, IconCheck } from "@tabler/icons-react";

export default function AuthenticationForm() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#fafafa]">
      <div className="w-[480px] py-10 flex flex-col p-8 bg-white rounded-lg shadow-lg justify-center items-center">
        <div className="bg-[#4bae4f] rounded-full w-14 h-14 flex items-center justify-center">
          <IconCheck color="white" size={32} stroke={6} />
        </div>
        <div className="font-bold text-xl text-black mt-6">
          Password Reset Successfully!
        </div>
        <div className="text-sm text-slate-500 mt-3 mb-8 px-10 text-center">
          Your password has been updated. You can now sign in with your new
          credentials
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
  );
}
