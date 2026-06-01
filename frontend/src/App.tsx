import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Dashboard } from "./pages/Dashboard";
import { VaultCreate } from "./pages/VaultCreate";
import { VaultDetail } from "./pages/VaultDetail";
import { MemorialRedirect } from "./pages/MemorialRedirect";
import { PublicMemorial } from "./pages/PublicMemorial";
import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";
import { Pricing } from "./pages/Pricing";
import { ServiceLanding } from "./pages/services/ServiceLanding";
import { Legacy } from "./pages/Legacy";
import { Privacy } from "./pages/legal/Privacy";
import { Terms } from "./pages/legal/Terms";
import { Cookies } from "./pages/legal/Cookies";
import { VerifyEmail } from "./pages/VerifyEmail";
import { Help } from "./pages/Help";

const App = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/pricing" element={<Pricing />} />
    <Route path="/servicios/:slug" element={<ServiceLanding />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/cookies" element={<Cookies />} />
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="/help" element={<Help />} />
    <Route path="/m/:slug" element={<PublicMemorial />} />
    <Route
      path="/app"
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path="vaults/new" element={<VaultCreate />} />
      <Route path="vaults/:id" element={<VaultDetail />} />
      {/* Memorials are now a surface inside their vault. Redirect old links. */}
      <Route path="memorials" element={<Navigate to="/app" replace />} />
      <Route path="memorials/new" element={<Navigate to="/app" replace />} />
      <Route path="memorials/:id" element={<MemorialRedirect />} />
      <Route path="legacy" element={<Legacy />} />
      <Route path="settings" element={<Settings />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
