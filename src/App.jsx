import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { auth } from './services/supabase'
import Login from './pages/Login'
import Admin from './pages/Admin'
import StoreLeader from './pages/StoreLeader'
import Employee from './pages/Employee'
import './styles/theme.css'
import './styles/animations.css'

// Protected Route wrapper
function ProtectedRoute({ children, allowedTypes = [], allowedCargos = [] }) {
    const user = auth.getCurrentUser()

    if (!user) {
        return <Navigate to="/" replace />
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(user.tipo)) {
        return <Navigate to="/" replace />
    }

    if (allowedCargos.length > 0 && !allowedCargos.includes(user.cargo)) {
        return <Navigate to="/" replace />
    }

    return children
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        // Check if user is logged in
        const user = auth.getCurrentUser()
        setIsAuthenticated(!!user)
    }, [])

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedTypes={['admin']}>
                            <Admin />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/store-leader"
                    element={
                        <ProtectedRoute allowedCargos={['lider_loja']}>
                            <StoreLeader />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/employee"
                    element={
                        <ProtectedRoute>
                            <Employee />
                        </ProtectedRoute>
                    }
                />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
