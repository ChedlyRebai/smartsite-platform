import { Route, RouterProvider, Routes } from "react-router";
import { Toaster } from "react-hot-toast";
import { router } from "./routes";
import ModalProvider from "./provider/ModalProvider";
import ThemeSync from "./components/ThemeSync";
import { ThemeProvider } from "./context/ThemeContext";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GlobalAccessibilityBar } from "./components/accessibility/GlobalAccessibilityBar";
import "stream-chat-react/dist/css/v2/index.css";
import { LanguageProvider } from "./context/LanguageContext";
// @ts-expect-error - package exposes CSS without TypeScript declarations
import "@svar-ui/react-gantt/all.css";
const queryClient = new QueryClient();

export default function App() {
  return (
    <>
      <GlobalAccessibilityBar />

      <ThemeProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeSync />
            <RouterProvider router={router} />

            <ModalProvider />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </LanguageProvider>
      </ThemeProvider>
    </>
  );
}
