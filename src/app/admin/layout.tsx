import { Header } from "@/components/layout/Header";
import { AdminTabNav } from "./AdminTabNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <AdminTabNav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </>
  );
}
