import BottomNav from "@/components/ui/BottomNav";

export default function TrackingLayout({
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
