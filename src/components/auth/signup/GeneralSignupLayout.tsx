import Link from "next/link";
import { ReactNode } from "react";

interface GeneralSignupLayoutProps {
  title: string;
  step: number;
  children: ReactNode;
}

export const GeneralSignupLayout = ({
  title,
  step,
  children,
}: GeneralSignupLayoutProps) => {
  const steps = 4; // Number of steps in the signup process

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#fafafa]">
      <div className="w-[660px] flex flex-col p-8 bg-white rounded-lg shadow-lg">
        {/* Header Section */}
        <div className="flex items-center justify-between text-black text-2xl font-bold">
          <div>{title}</div>
          <div className="flex gap-1">
            {[...Array(steps)].map((_, index) => (
              <div
                key={index}
                className={`w-10 h-2 rounded-full ${
                  index + 1 <= step ? "bg-[#292929]" : "bg-gray-200"
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Sign-in Link */}
        <div className="text-[#989898] mt-1">
          Already have an account?{" "}
          <span className="text-black underline font-bold">
            <Link href="/auth/login">Sign In</Link>
          </span>
        </div>

        {/* Content Section */}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};
