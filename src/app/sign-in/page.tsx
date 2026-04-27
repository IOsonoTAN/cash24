import { redirect } from "next/navigation";
import type { Route } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { getSession } from "@/lib/session";

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/dashboard";
  const hasGoogleError = params.error === "google";
  const session = await getSession();
  const safeCallbackUrl = callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";

  if (session?.user) {
    redirect(safeCallbackUrl as Route);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="glass w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Cash24</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center text-sm text-muted-foreground">
            Sign in with your Google account to continue.
          </p>
          {hasGoogleError ? (
            <p className="text-center text-sm text-destructive">
              Google sign-in is unavailable. Check OAuth credentials and callback URL.
            </p>
          ) : null}
          <GoogleSignInButton callbackUrl={safeCallbackUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
