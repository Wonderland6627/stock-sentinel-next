import type { Metadata } from "next";
import BottomNav from "@/components/ui/BottomNav";

export const metadata: Metadata = {
  title: "股票筛选",
};

export default function ScreenerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </>
  );
}
