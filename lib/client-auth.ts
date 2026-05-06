import * as React from "react";
import type { AppRole } from "@/lib/access-control";

export function useCurrentAuth() {
  const [auth, setAuth] = React.useState<{ email: string; role: AppRole }>({ email: "", role: "staff" });

  React.useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => {
        if (mounted) setAuth({ email: data.email ?? "", role: data.role === "admin" ? "admin" : "staff" });
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  return auth;
}
