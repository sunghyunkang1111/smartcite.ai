import React from "react";
import { Badge } from "@mantine/core";

type PlanType = "basic" | "premium" | "enterprise";

interface PlanPillProps {
  plan: PlanType;
}

const planStyles: Record<PlanType, React.CSSProperties> = {
  basic: {
    backgroundColor: "#E3FCEF",
    color: "#1E6951",
  },
  premium: {
    backgroundColor: "#FFF7E3",
    color: "#7C5B07",
  },
  enterprise: {
    backgroundColor: "#F0E7FA",
    color: "#5B2C6F",
  },
};

export function PricingPlanPill({ plan }: PlanPillProps) {
  return (
    <Badge
      variant="filled"
      radius="xl"
      style={{
        ...planStyles[plan],
        textTransform: 'capitalize',
      }}
    >
      {plan}
    </Badge>
  );
}
