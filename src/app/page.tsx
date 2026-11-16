import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/session";
import BulkReader from "@/components/ktp/bulk-reader";
export const dynamic = "force-dynamic";
export default async function Home() { if (!await isAuthenticated()) redirect("/login"); return <BulkReader />; }
