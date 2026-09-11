import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/admin/Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <Sidebar categories={categories.map((c) => c.name)} studioMode />
      <div className="main">
        <Dashboard />
      </div>
    </>
  );
}
