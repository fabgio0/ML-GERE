import { useEffect } from "react";
import { Toaster } from "sonner";
import { AppShell } from "@/components/app/app-shell";
import { RouterProvider, useRouter } from "@/lib/router";
import { BoletosPage } from "@/pages/BoletosPage";
import { NotasPage } from "@/pages/NotasPage";
import { PainelPage } from "@/pages/PainelPage";
import { ServicosPage } from "@/pages/ServicosPage";

const PAGE_TITLES: Record<string, string> = {
  "/": "Painel financeiro — Fluxa",
  "/boletos": "Boletos — Fluxa",
  "/notas": "Notas fiscais — Fluxa",
  "/servicos": "Entradas e saídas — Fluxa",
};

function AppContent() {
  const { pathname } = useRouter();

  useEffect(() => {
    document.title = PAGE_TITLES[pathname] ?? "Fluxa";
  }, [pathname]);

  return (
    <AppShell>
      {pathname === "/" && <PainelPage />}
      {pathname === "/boletos" && <BoletosPage />}
      {pathname === "/notas" && <NotasPage />}
      {pathname === "/servicos" && <ServicosPage />}
    </AppShell>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AppContent />
      <Toaster position="bottom-right" richColors closeButton />
    </RouterProvider>
  );
}
