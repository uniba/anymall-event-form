import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuthorizationFromHeaders } from "@/lib/admin-access";

export async function getCurrentAdminAuthorization() {
  return getAdminAuthorizationFromHeaders(await headers());
}

export async function requireAdminAccess() {
  const authorization = await getCurrentAdminAuthorization();

  if (authorization.status === "unauthenticated") {
    redirect("/admin/login");
  }

  if (authorization.status === "unauthorized") {
    redirect("/admin/unauthorized");
  }

  return authorization.session;
}
