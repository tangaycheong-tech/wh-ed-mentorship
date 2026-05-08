"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(data => {
      if (!data?.user) { router.push("/login"); return; }
      const { role } = data.user;
      if (role === "mentor") router.replace("/dashboard/mentor");
      else if (role === "mentee") router.replace("/dashboard/mentee");
      else if (role === "admin") router.replace("/dashboard/admin");
      else router.push("/login");
    });
  }, [router]);
  return <div className="text-slate-500">Loading dashboard...</div>;
}