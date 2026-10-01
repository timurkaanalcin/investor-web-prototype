import { CrmShell } from "@/components/crm/CrmShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CrmShell>{children}</CrmShell>;
}
