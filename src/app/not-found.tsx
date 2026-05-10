import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-6xl font-bold text-muted-foreground/30 mb-4">404</p>
        <h2 className="text-lg font-semibold mb-2">页面未找到</h2>
        <p className="text-sm text-muted-foreground mb-6">
          您访问的页面不存在或已被移除
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
        >
          <Home className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    </div>
  );
}
