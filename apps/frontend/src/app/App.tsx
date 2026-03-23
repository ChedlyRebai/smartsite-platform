import { RouterProvider } from "react-router";
import toast, { Toaster } from "react-hot-toast";
import { router } from "./routes";
import ModalProvider from "./provider/ModalProvider";
import "@svar-ui/react-gantt/all.css";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />

        <ModalProvider />
        <Toaster position="top-right" />
      </QueryClientProvider>
    </>
  );
}
