"use client";
import {
  TextInput,
  PasswordInput,
  Button,
  MantineProvider,
} from "@mantine/core";
import { useLogin } from "@refinedev/core";
import { FormEvent, useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { getSuperAdminToken } from "@/services/keycloak/user.service";
import { getOrganizationById } from "@/services/keycloak/organization.service";
import { useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function AuthenticationForm() {
  const { mutate: login } = useLogin();
  const [orgData, setOrgData] = useState<any>({});
  const searchParams = useSearchParams();
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
  useEffect(() => {
    const organizationId = searchParams.get("organizationId");
    const token = searchParams.get("key");

    if (token) {
      validateInviteToken(token)
        .then((decodedToken) => {
          form.setFieldValue("email", decodedToken.eml);
        })
        .catch((error) => {
          console.error(error);
        });
    }

    const getOrg = async (organizationId: string) => {
      try {
        const adminToken = await getSuperAdminToken();
        const orgData = await getOrganizationById(
          organizationId,
          adminToken.access_token
        );
        setOrgData(orgData);
      } catch (error) {
        console.log(error);
      }
    };
    if (organizationId) {
      getOrg(organizationId);
    }
  }, [searchParams]);

  const validateInviteToken = async (token: string): Promise<any> => {
    try {
      const decodedToken = jwtDecode<any>(token);
      if (!decodedToken.eml || !decodedToken.exp || !decodedToken.sub) {
        return Promise.reject(
          new Error("Invalid token: Missing required fields")
        );
      }
      const currentTime = Date.now() / 1000;
      if (decodedToken?.exp && decodedToken?.exp < currentTime) {
        return Promise.reject(new Error("Token has expired"));
      }
      return Promise.resolve(decodedToken);
    } catch (error) {
      console.log(error);
      return Promise.reject(new Error("Token validation failed"));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.validate().hasErrors) {
      return;
    }
    login({
      email: form.values.email,
      password: form.values.password,
      organizationId: orgData?.id,
    });
  };
  return (
    <MantineProvider>
      <div className="h-screen w-full flex items-center justify-center bg-[#fafafa]">
        <div className="w-[500px] flex flex-col p-8 bg-white rounded-lg shadow-2xl">
          <div className="flex items-center text-black text-xl font-bold">
            Sign in to join to {orgData?.name} Organization
          </div>
          <div className="mt-4">
            <form onSubmit={handleSubmit}>
              <TextInput
                required
                label="Email"
                placeholder="hello@mantine.dev"
                value={form.values.email}
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
            </form>
          </div>
        </div>
      </div>
    </MantineProvider>
  );
}
