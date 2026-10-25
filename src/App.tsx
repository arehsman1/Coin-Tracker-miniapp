import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ServicePage } from "./pages/Service";
import { Settings } from "./pages/Settings";
import { TokenDetail } from "./pages/TokenDetail";
import { Tokens } from "./pages/Tokens";
import { WalletDetail } from "./pages/WalletDetail";
import { Wallets } from "./pages/Wallets";

// HashRouter works when hosted as static files without server rewrite rules
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tokens" element={<Tokens />} />
          <Route path="tokens/:chain/:address" element={<TokenDetail />} />
          <Route path="wallets" element={<Wallets />} />
          <Route path="wallets/:chain/:address" element={<WalletDetail />} />
          <Route path="service" element={<ServicePage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
