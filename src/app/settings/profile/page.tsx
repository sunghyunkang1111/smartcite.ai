"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  LoadingOverlay,
  PasswordInput,
  TextInput,
} from "@mantine/core";
import { useGetIdentity } from "@refinedev/core";
import { useForm } from "@mantine/form";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  getUserById,
  updatePassword,
  updateUser,
} from "@services/keycloak/user.service";
import { SettingLayout } from "@/components/settings/SettingLayout";
import { getAccessToken } from "@services/auth.service";
import { notification } from "antd";

interface FormValues {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  lawFirmName: string;
  licenseNumber: string;
  practiceArea: string;
}

interface PasswordFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState({ email: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const { data: userData, isLoading: isUserDataLoading } =
    useGetIdentity<any>();

  const form = useForm<FormValues>({
    initialValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      lawFirmName: "",
      licenseNumber: "",
      practiceArea: "",
    },
    validate: {},
  });

  const passwordForm = useForm<PasswordFormValues>({
    initialValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validate: {
      confirmPassword: (val, values) =>
        val !== values.newPassword ? "Passwords don't match" : null,
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userData) return;
      try {
        const token = await getAccessToken();
        const res = await getUserById(userData.sub, token || "");
        setUserInfo(res);
        form.setValues({
          email: res.email,
          firstName: res.firstName,
          lastName: res.lastName,
          phone: res?.attributes?.phoneNumber?.[0] || "",
          lawFirmName: res?.attributes?.lawFirmName?.[0] || "",
          licenseNumber: res?.attributes?.licenseNumber?.[0] || "",
          practiceArea: res?.attributes?.practiceArea?.[0] || "",
        });
      } catch (error) {
        notification.error({
          message: "Error",
          description: "Failed to fetch user data. Please try again later.",
        });
      }
    };

    fetchUserData();
  }, [userData]);

  const handleProfileUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (form.validate().hasErrors) return;

    setIsLoading(true);
    try {
      const payload = {
        ...userInfo,
        id: userData.sub,
        firstName: form.values.firstName,
        lastName: form.values.lastName,
        attributes: {
          phoneNumber: [form.values.phone],
          lawFirmName: [form.values.lawFirmName],
          licenseNumber: [form.values.licenseNumber],
          practiceArea: [form.values.practiceArea],
        },
      };

      await updateUser(userData.sub, payload);
      notification.success({
        message: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to update profile. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.validate().hasErrors) return;

    setIsPasswordLoading(true);
    try {
      await updatePassword(
        userData.sub,
        userData.email,
        passwordForm.values.oldPassword,
        passwordForm.values.newPassword
      );
      notification.success({
        message: "Success",
        description: "Password updated successfully.",
      });
      passwordForm.reset();
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Old password is incorrect.",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const renderFormField = (
    label: string,
    name: keyof FormValues,
    placeholder: string,
    required: boolean = true,
    disabled?: boolean
  ) => (
    <TextInput
      required={required}
      label={label}
      placeholder={placeholder}
      value={form.values[name]}
      onChange={(event) => form.setFieldValue(name, event.currentTarget.value)}
      error={form.errors[name]}
      radius="sm"
      labelProps={{
        style: { color: "black", marginBottom: "6px" },
      }}
      disabled={disabled}
    />
  );

  const renderPasswordFormField = (
    label: string,
    name: keyof PasswordFormValues,
    placeholder: string,
    disabled?: boolean
  ) => (
    <PasswordInput
      required
      label={label}
      placeholder={placeholder}
      value={passwordForm.values[name]}
      onChange={(event) =>
        passwordForm.setFieldValue(name, event.currentTarget.value)
      }
      error={passwordForm.errors[name]}
      radius="sm"
      labelProps={{ style: { color: "black", marginBottom: "6px" } }}
      disabled={disabled}
    />
  );

  return (
    <SettingLayout>
      <div>
        <div className="mt-2">
          <div className="text-2xl text-[#292929] font-bold pb-4">Profile</div>
          <form
            onSubmit={handleProfileUpdate}
            className="bg-white px-5 py-5 rounded-lg relative"
          >
            <LoadingOverlay
              visible={isLoading || isUserDataLoading}
              zIndex={1000}
              overlayProps={{ radius: "sm", blur: 2 }}
              loaderProps={{ color: "black", type: "bars" }}
            />
            <div className="text-xl font-semibold text-[#292929] pb-4">
              General Information
            </div>
            <div className="flex flex-col gap-4">
              {renderFormField("Email", "email", "Enter email here", true)}
              <div className="grid grid-cols-2 gap-4">
                {renderFormField(
                  "First Name",
                  "firstName",
                  "Enter first name here"
                )}
                {renderFormField(
                  "Last Name",
                  "lastName",
                  "Enter last name here"
                )}
              </div>
              <div>
                <div className="text-black text-sm mb-1">Phone number</div>
                <PhoneInput
                  placeholder="Enter phone number"
                  country={"us"}
                  value={form.values.phone}
                  onChange={(phone) => form.setFieldValue("phone", phone)}
                />
              </div>
              {renderFormField(
                "Law Firm Name",
                "lawFirmName",
                "Enter law firm name here",
                false
              )}
              {renderFormField(
                "License Number",
                "licenseNumber",
                "Enter license number here",
                false
              )}
              {renderFormField(
                "Practice Area",
                "practiceArea",
                "Enter practice area here",
                false
              )}
              <div className="flex justify-end">
                <Button
                  variant="filled"
                  style={{
                    width: "150px",
                    fontWeight: "normal",
                    backgroundColor: "#333333",
                  }}
                  type="submit"
                >
                  Update Profile
                </Button>
              </div>
            </div>
          </form>
          <form
            onSubmit={handlePasswordUpdate}
            className="bg-white px-5 py-5 rounded-lg mt-6 relative"
          >
            <LoadingOverlay
              visible={isPasswordLoading}
              zIndex={1000}
              overlayProps={{ radius: "sm", blur: 2 }}
              loaderProps={{ color: "black", type: "bars" }}
            />
            <div className="text-xl font-semibold text-[#292929] pb-4">
              Change Password
            </div>
            <div className="flex flex-col gap-4">
              {renderPasswordFormField(
                "Old Password",
                "oldPassword",
                "Enter old password here"
              )}
              {renderPasswordFormField(
                "New Password",
                "newPassword",
                "Enter new password here"
              )}
              {renderPasswordFormField(
                "Confirm Password",
                "confirmPassword",
                "Enter confirm password here"
              )}
              <div className="flex justify-end">
                <Button
                  variant="filled"
                  style={{
                    width: "150px",
                    fontWeight: "normal",
                    backgroundColor: "#333333",
                  }}
                  type="submit"
                >
                  Update Password
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </SettingLayout>
  );
}
