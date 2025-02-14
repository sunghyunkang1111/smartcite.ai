export const DocType = {
  MAIN: "Main",
  EXHIBIT: "Exhibit",
};
export const RoleOptiosn = {
  INDIVIDUAL: "INDIVIDUAL",
  ORGANIZATION: "ORGANIZATION",
};

export const Group = {
  ADMIN: "AdminGroup",
  USER: "UserGroup",
};

export const Roles = {
  ADMIN: "admin",
  USER: "user",
};

export const CaseStates = ["Opened", "In Progress", "Closed"];

export const ClientRoles = ["Petitioner", "Respondent"];

export const CaseStateBgColor = {
  Opened: "#fff8f2",
  "In Progress": "#ecf2ff",
  Closed: "#f7f7f7",
};

export const CaseStateTextColor: Record<string, string> = {
  Opened: "#ff7f00",
  "In Progress": "#056cf3",
  Closed: "#989898",
};

export const UploadingState = {
  DOING: "DOING",
  SUCCESS: "SUCCESS",
  FAIL: "FAIL",
};
