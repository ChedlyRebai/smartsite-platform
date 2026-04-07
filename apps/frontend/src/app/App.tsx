import { Route, RouterProvider, Routes } from "react-router";
import { Toaster } from "react-hot-toast";
import { router } from "./routes";
import ModalProvider from "./provider/ModalProvider";
import ThemeSync from "./components/ThemeSync";
import { ThemeToggle } from "./components/ThemeToggle";
import "@svar-ui/react-gantt/all.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/videoCall/Layout";
import ChatPage from "./pages/videoCall/ChatPage";
import HomePage from "./pages/videoCall/HomePage";
import NotificationsPage from "./pages/videoCall/NotificationsPage";
import CallPage from "./pages/videoCall/CallPage";
import OnboardingPage from "./pages/videoCall/OnboardingPage";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";
const queryClient = new QueryClient();

export default function App() {
  return (
    <>
      

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
