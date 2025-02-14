"use client";
import {
  TextInput,
  PasswordInput,
  Button,
  LoadingOverlay,
} from "@mantine/core";
import { useNavigation } from "@refinedev/core";
import { FormEvent, useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { useSearchParams } from "next/navigation";
import { Group, RoleOptiosn } from "@/utils/util.constants";
import { GeneralSignupLayout } from "@/components/auth/signup/GeneralSignupLayout";
import {
  addUserToOrganization,
  getSuperAdminToken,
  registerUser,
  sendVerifyEmail,
} from "@/services/keycloak/user.service";
import { getOrganizationById } from "@/services/keycloak/organization.service";
import { jwtDecode } from "jwt-decode";
import { notification } from "antd";

export default function Page() {
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const [orgData, setOrgData] = useState<any>({});
  const [tokenData, setTokenData] = useState<any>({});
  const form = useForm({
    initialValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      password2: "",
    },

    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : "Invalid email"),
      password2: (val, values) =>
        val !== values.password ? "Passwords don't match" : null,
    },
  });

  useEffect(() => {
    const organizationId = searchParams.get("organizationId");
    const token = searchParams.get("key");
    if (token) {
      validateInviteToken(token)
        .then((decodedToken) => {
          setTokenData(decodedToken);
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
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
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
      if (!decodedToken.eml || !decodedToken.exp) {
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
    try {
      setIsLoading(true);
      const adminToken = await getSuperAdminToken();
      if (!adminToken) throw new Error("Failed to retrieve admin token.");
      const role = localStorage.getItem("signupRole");
      const group = role === RoleOptiosn.ORGANIZATION ? Group.ADMIN : Group.USER;
      const createdUserId = await registerUser(
        form.values.email,
        form.values.firstName,
        form.values.lastName,
        form.values.password,
        group,
        adminToken.access_token
      );

      if (!createdUserId) throw new Error("Failed to create a user.");
      if (orgData.id) {
        await addUserToOrganization(
          createdUserId,
          orgData.id,
          adminToken.access_token
        );
      }

      const sendEmail = await sendVerifyEmail(createdUserId, adminToken.access_token);
      if (!sendEmail) throw new Error("Failed to send verify email.");
      setIsLoading(false);
      notification.success({
        message: "Success",
        description: "Successfully sent a verify email",
      });
      push(`/auth/signup/verify-email?userid=${createdUserId}`);
    } catch (error: any) {
      setIsLoading(false);
      console.log("Error found", error.response.data.errorMessage);
      notification.error({
        message: "Error",
        description: error.response.data.errorMessage,
      });
    }
    // handleNextStep();
  };
  const handleBackStep = () => {
    push("/auth/signup/");
  };
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#fafafa]">
      <GeneralSignupLayout title="Setup Your Account" step={2}>
        <div className="relative">
          <LoadingOverlay
            visible={isLoading}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
            loaderProps={{ color: "pink", type: "bars" }}
          />
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  required
                  label="First Name"
                  placeholder="Enter your first name"
                  value={form.values.firstName}
                  onChange={(event) =>
                    form.setFieldValue("firstName", event.currentTarget.value)
                  }
                  error={form.errors.firstName}
                  radius="sm"
                  labelProps={{
                    style: { color: "black", marginBottom: "6px" },
                  }}
                />
                <TextInput
                  required
                  label="Last Name"
                  placeholder="Enter your last name"
                  value={form.values.lastName}
                  onChange={(event) =>
                    form.setFieldValue("lastName", event.currentTarget.value)
                  }
                  error={form.errors.lastName}
                  radius="sm"
                  labelProps={{
                    style: { color: "black", marginBottom: "6px" },
                  }}
                />
              </div>
              <TextInput
                required
                label="Email"
                placeholder="Enter your email"
                value={form.values.email}
                onChange={(event) => {
                  if (tokenData.eml) return;
                  form.setFieldValue("email", event.currentTarget.value);
                }}
                error={form.errors.email && "Invalid email"}
                radius="sm"
                labelProps={{ style: { color: "black", marginBottom: "6px" } }}
              />
              <PasswordInput
                required
                label="Password"
                placeholder="Enter your password"
                value={form.values.password}
                onChange={(event) =>
                  form.setFieldValue("password", event.currentTarget.value)
                }
                error={form.errors.password}
                radius="sm"
                labelProps={{ style: { color: "black", marginBottom: "6px" } }}
              />
              <PasswordInput
                required
                label="Confirm Password"
                placeholder="Re-enter password"
                value={form.values.password2}
                onChange={(event) =>
                  form.setFieldValue("password2", event.currentTarget.value)
                }
                error={form.errors.password2}
                radius="sm"
                labelProps={{ style: { color: "black", marginBottom: "6px" } }}
              />
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <Button
                variant="default"
                color="dark.6"
                radius="md"
                size="md"
                style={{ fontSize: "14px" }}
                onClick={handleBackStep}
              >
                Back
              </Button>
              <Button
                variant="filled"
                color="dark.6"
                radius="md"
                size="md"
                style={{ fontSize: "14px" }}
                type="submit"
              >
                Continue
              </Button>
            </div>
          </form>
        </div>
      </GeneralSignupLayout>
    </div>
  );
}
