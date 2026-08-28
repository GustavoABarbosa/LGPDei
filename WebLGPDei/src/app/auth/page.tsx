import { Suspense } from "react";

import { AuthPage } from "@/components/auth/AuthPage";

export default function AuthRoute() {
  return (
    <Suspense fallback={null}>
      <AuthPage />
    </Suspense>
  );
}
