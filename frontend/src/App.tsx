import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ManageExams from "./pages/admin/ManageExams";
import CreateExam from "./pages/admin/CreateExam";
import StudentExams from "./pages/student/StudentExams";
import StudentResults from "./pages/student/StudentResults";
import StudentResultDetail from "./pages/student/StudentResultDetail";
import TakeExam from "./pages/student/TakeExam";
import AssistantChat from "./pages/AssistantChat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/assistant" element={
              <ProtectedRoute>
                <AssistantChat />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/dashboard/exams" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageExams />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/exams/create" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CreateExam />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/results" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <StudentResults />
              </ProtectedRoute>
            } />
            
            {/* Student Routes */}
            <Route path="/dashboard/my-exams" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentExams />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/my-results" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentResults />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/my-results/:attemptId" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentResultDetail />
              </ProtectedRoute>
            } />
            <Route path="/exam/:examId" element={
              <ProtectedRoute allowedRoles={['student']}>
                <TakeExam />
              </ProtectedRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
