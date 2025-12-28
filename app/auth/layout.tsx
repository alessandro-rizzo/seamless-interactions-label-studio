import { MobileWarning } from "@/components/mobile-warning";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MobileWarning />
      {children}
    </>
  );
}
