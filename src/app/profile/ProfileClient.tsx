"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface ProfileClientProps {
  email: string;
}

export default function ProfileClient({ email }: ProfileClientProps) {
  const router = useRouter();
  const [signOutError, setSignOutError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    setSignOutError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSignOutError("退出登录失败，请重试");
      setLoading(false);
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-10">
      {/* Avatar + email */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
          <User className="w-12 h-12 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>

      {/* Settings list */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          设置
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-danger hover:bg-muted transition-colors disabled:opacity-50"
          >
            <span>退出登录</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {signOutError && (
          <p className="mt-2 text-xs text-danger px-1">{signOutError}</p>
        )}
      </div>
    </div>
  );
}
