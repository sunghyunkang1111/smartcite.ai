"use client";
import {
  TextInput,
  PasswordInput,
  Button,
  MantineProvider,
  Checkbox,
  LoadingOverlay,
} from "@mantine/core";
import { useLogin } from "@refinedev/core";
import Link from "next/link";
import { useForm } from "@mantine/form";
import { FormEvent } from "react";
import { notification } from "antd";
// import { IconAntennaBars5 } from "@tabler/icons-react";

export default function AuthenticationForm() {
  const { mutate: login, isLoading: isLoginLoading } = useLogin();
  const form = useForm({
    initialValues: {
      email: "",
      name: "",
      password: "",
      terms: true,
    },

    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : "Invalid email"),
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.validate().hasErrors) {
      return;
    }
    login(
      { email: form.values.email, password: form.values.password },
      {
        onError: (error) => {
          console.log(error);
          notification.error({
            message: "Error",
            description: "Email or Password is incorrect",
          });
        },
      }
    );
  };

  return (
    <MantineProvider>
      <div className="h-screen w-full flex items-center justify-center bg-[#fafafa]">
        <div className="w-[500px] flex flex-col p-8 bg-white rounded-lg shadow-2xl relative">
          <LoadingOverlay
            visible={isLoginLoading}
            zIndex={1000}
            loaderProps={{ color: "black", type: "bars" }}
          />
          <div className="p-6 flex items-center justify-center text-xl text-black">
            {/* <IconAntennaBars5 size={24} /> */}
            <span className="text-[#394149] font-bold ml-2">SMART</span>
            <span className="text-[#394149]">CITE</span>
          </div>
          <div className="flex items-center text-black text-2xl font-bold">
            Sign in
          </div>
          <div className="text-[#989898] mt-1">
            Don&apos;t have an account?{" "}
            <Link
              href={"/auth/signup"}
              className="text-black underline font-bold"
            >
              Sign Up
            </Link>
          </div>
          <div className="mt-4">
            <form onSubmit={handleSubmit}>
              <TextInput
                required
                label="Email"
                placeholder="hello@mantine.dev"
                value={form.values.email}
                onChange={(event) =>
                  form.setFieldValue("email", event.currentTarget.value)
                }
                error={form.errors.email && "Invalid email"}
                radius="sm"
                labelProps={{ style: { color: "black", marginBottom: "6px" } }}
              />
              <div className="mt-4"></div>
              <PasswordInput
                required
                label="Password"
                placeholder="Your password"
                value={form.values.password}
                onChange={(event) =>
                  form.setFieldValue("password", event.currentTarget.value)
                }
                error={
                  form.errors.password &&
                  "Password should include at least 6 characters"
                }
                radius="sm"
                labelProps={{ style: { color: "black", marginBottom: "6px" } }}
              />
              <div className="mt-4 flex justify-between">
                <Checkbox label="Remember me" />
                <Link
                  href="/auth/forgot-password"
                  className="text-black underline text-sm"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-6"></div>
              <Button
                variant="filled"
                color="dark.6"
                radius="md"
                size="md"
                fullWidth
                style={{ fontSize: "14px" }}
                type="submit"
              >
                Sign in
              </Button>
              {/* <Divider
                my="xs"
                label="Or"
                labelPosition="center"
                style={{ margin: "26px 0" }}
              />
              <Button
                variant="default"
                radius="md"
                size="md"
                fullWidth
                style={{ fontWeight: "400", fontSize: "14px" }}
                leftSection={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid"
                    viewBox="0 0 256 262"
                    style={{ width: "0.9rem", height: "0.9rem" }}
                  >
                    <path
                      fill="#4285F4"
                      d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                    />
                    <path
                      fill="#34A853"
                      d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                    />
                    <path
                      fill="#FBBC05"
                      d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                    />
                    <path
                      fill="#EB4335"
                      d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                    />
                  </svg>
                }
              >
                Continue with Google
              </Button> */}
            </form>
          </div>
        </div>
      </div>
    </MantineProvider>
  );
}
