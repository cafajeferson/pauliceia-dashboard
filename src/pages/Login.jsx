import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../services/supabase'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Card from '../components/common/Card'
import './Login.css'

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!username || !password) {
            setError('Preencha todos os campos!')
            return
        }

        setLoading(true)

        try {
            const user = await auth.login(username, password)

            if (user) {
                auth.setCurrentUser(user)

                // Navigate based on user type
                if (user.tipo === 'admin') {
                    navigate('/admin')
                } else if (user.cargo === 'lider_loja') {
                    navigate('/store-leader')
                } else {
                    navigate('/employee')
                }
            } else {
                setError('Usuário ou senha incorretos!')
            }
        } catch (err) {
            setError('Erro ao fazer login. Tente novamente.')
            console.error('Login error:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-background">
                <div className="login-gradient-orb login-gradient-orb--1"></div>
                <div className="login-gradient-orb login-gradient-orb--2"></div>
                <div className="login-gradient-orb login-gradient-orb--3"></div>
            </div>

            <div className="login-container animate-scale-in">
                <Card glass className="login-card">
                    <div className="login-header">
                        <img src="/logo.png" alt="Paulicéia" className="login-logo" />
                        <h1 className="login-title">Bem-vindo!</h1>
                        <p className="login-subtitle">Faça login para continuar</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <Input
                            label="Usuário"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Digite seu login"
                            icon={<span>👤</span>}
                            disabled={loading}
                        />

                        <Input
                            label="Senha"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite sua senha"
                            icon={<span>🔒</span>}
                            disabled={loading}
                        />

                        {error && (
                            <div className="login-error animate-slide-down">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={loading}
                        >
                            ENTRAR
                        </Button>
                    </form>

                    <p className="login-footer">
                        Paulicéia Tintas - Sistema de Gestão
                    </p>
                </Card>
            </div>
        </div>
    )
}
