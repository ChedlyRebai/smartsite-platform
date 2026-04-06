import { RouterProvider } from "react-router";
import { Toaster } from "react-hot-toast";
import { router } from "./routes";
import ModalProvider from "./provider/ModalProvider";
import ThemeSync from "./components/ThemeSync";
import { ThemeToggle } from "./components/ThemeToggle";
import "@svar-ui/react-gantt/all.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GlobalAccessibilityBar } from "./components/accessibility/GlobalAccessibilityBar";

const queryClient = new QueryClient();

export default function App() {
  return (
    <>
      <GlobalAccessibilityBar />
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        <RouterProvider router={router} />

        <ModalProvider />
        <Toaster position="top-right" />

        <div className="fixed bottom-6 left-6 z-[55] flex items-center gap-2">
          <ThemeToggle />
        </div>
      </QueryClientProvider>
    </>
  );
}
