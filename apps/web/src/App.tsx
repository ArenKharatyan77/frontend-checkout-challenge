import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CatalogPage } from './pages/CatalogPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentPage } from './pages/PaymentPage';
import { SuccessPage } from './pages/SuccessPage';

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders/:orderId/payment" element={<PaymentPage />} />
        <Route path="/orders/:orderId/success" element={<SuccessPage />} />
      </Routes>
    </Layout>
  );
}
