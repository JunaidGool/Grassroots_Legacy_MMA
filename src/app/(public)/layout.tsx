import { Header } from "@/components/layout/Header";
import { PublicTabNav } from "./PublicTabNav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <PublicTabNav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </>
  );
}
