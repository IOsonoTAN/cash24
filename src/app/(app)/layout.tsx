import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShellHeader } from "@/components/app-shell-header";
import { SyncManager } from "@/components/pwa/sync-manager";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppShellHeader />
      <main className="mx-auto w-full max-w-[1280px] flex-1 p-4 md:p-6">{children}</main>
      <SyncManager />
    </div>
  );
}
