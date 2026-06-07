"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/store";
import Spinner from "@/components/Spinner";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getSession() ? "/home" : "/login");
  }, [router]);
  return <Spinner />;
}
