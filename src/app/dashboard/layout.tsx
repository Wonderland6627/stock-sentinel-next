import BottomNav from "@/components/ui/BottomNav";

export default function ProtectedLayout({
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
