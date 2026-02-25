import { RouterProvider } from 'react-router';
import toast, { Toaster } from "react-hot-toast";
import { router } from './routes';
import ModalProvider from './provider/ModalProvider';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ModalProvider/>
      <Toaster position="top-right" />
    </>
  );
}
