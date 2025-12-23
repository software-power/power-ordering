import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SettingsProvider } from "./context/SettingsContext";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import ProductsList from "./pages/ProductsList";
import OrdersList from "./pages/OrdersList";
import UsersList from "./pages/UsersList";
import RolesList from "./pages/RolesList";
import PriceLevelsMaster from "./pages/PriceLevelsMaster";
import Settings from "./pages/Settings";
import ProtectedRoute from "./router/ProtectedRoute";
import Layout from "./components/Layout";
import { ConfirmProvider } from "./context/ConfirmContext";
import { CartProvider } from "./context/CartContext.jsx";
import { Toaster } from 'react-hot-toast';
import ProductCatalogue from "./pages/ProductCatalogue.jsx";
import Cart from "./pages/Cart.jsx";
import OrderHistory from "./pages/OrderHistory.jsx";

const rootElement = document.getElementById("root");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    <AuthProvider>
      <SettingsProvider>
        <ThemeProvider>
          <ConfirmProvider>
            <CartProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public route */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  {/* Root path: redirect to dashboard if logged in */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Navigate to="/dashboard" replace />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected routes inside Layout */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/products/list" element={<ProductsList />} />
                    <Route path="/catalogue" element={<ProductCatalogue />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/my-orders" element={<OrderHistory />} />
                    <Route path="/orders" element={<OrdersList />} />
                    <Route path="/orders/list" element={<OrdersList />} />
                    <Route path="/orders/create" element={<OrdersList />} />
                    <Route path="/roles/list" element={<RolesList />} />
                    <Route path="/users/list" element={<UsersList />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/masters/price-levels" element={<PriceLevelsMaster />} />
                    {/* Add more protected routes here */}
                  </Route>
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </ConfirmProvider>
        </ThemeProvider>
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>
);
