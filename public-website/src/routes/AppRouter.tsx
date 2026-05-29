import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { SiteLayout } from "../components/layout/SiteLayout";
import { Contact } from "../pages/Contact";
import { Download } from "../pages/Download";
import { Features } from "../pages/Features";
import { Home } from "../pages/Home";
import { HowItWorks } from "../pages/HowItWorks";
import { PaymentRequest } from "../pages/PaymentRequest";
import { PrivacyPolicy } from "../pages/PrivacyPolicy";
import { Screenshots } from "../pages/Screenshots";
import { Terms } from "../pages/Terms";

const router = createBrowserRouter([
  {
    path: "/",
    element: <SiteLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "features", element: <Features /> },
      { path: "how-it-works", element: <HowItWorks /> },
      { path: "screenshots", element: <Screenshots /> },
      { path: "download", element: <Download /> },
      { path: "privacy-policy", element: <PrivacyPolicy /> },
      { path: "terms", element: <Terms /> },
      { path: "contact", element: <Contact /> },
      { path: "payment-request/:token", element: <PaymentRequest /> },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
