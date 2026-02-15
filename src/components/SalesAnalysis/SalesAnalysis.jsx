import { useState, useEffect } from 'react'
import { db } from '../../services/supabase'
import { salesService } from '../../services/sales'
import { parseCSV, readFileAsText } from '../../utils/csvParser'
import Button from '../common/Button'
import Card from '../common/Card'
import Input from '../common/Input'
import ClientDashboard from './ClientDashboard'
import { Line, Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js'
import './SalesAnalysis.css'

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

export default function SalesAnalysis({ userId }) {
    const [clientes, setClientes] = useState([])
    const [clienteSelecionado, setClienteSelecionado] = useState(null)
    const [anos, setAnos] = useState([])
    const [anoSelecionado, setAnoSelecionado] = useState(null)
    const [vendas, setVendas] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState('dashboard')
    const [uploadProgress, setUploadProgress] = useState(null)
    const [matrizData, setMatrizData] = useState(null)
    const [filtro, setFiltro] = useState('')
    const [favoritos, setFavoritos] = useState([])
    const [mesSelecionadoAnalise, setMesSelecionadoAnalise] = useState(null)
    const [analiseData, setAnaliseData] = useState(null)
    const [selectedFavorito, setSelectedFavorito] = useState(null)
    const [searchTermFavoritos, setSearchTermFavoritos] = useState('') // Search term for adding favorites
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [groupSearchTerm, setGroupSearchTerm] = useState('')
    const [groupProducts, setGroupProducts] = useState({}) // { groupId: ['produto1', 'produto2'] }
    const [editingGroupId, setEditingGroupId] = useState(null)
    const [editingGroupName, setEditingGroupName] = useState('')

    const DEFAULT_GROUPS = [
        { id: 'lixa_hookits', nome: 'LIXA E HOOKITS' },
        { id: 'polimentos', nome: 'POLIMENTOS' },
        { id: 'fitas', nome: 'FITAS' },
        { id: 'thinner_diluentes', nome: 'THINNER E DILUENTES' },
        { id: 'pigmentos', nome: 'PIGMENTOS' },
        { id: 'sikas', nome: 'SIKAS' },
        { id: 'abrasivos', nome: 'ABRASIVOS' },
        { id: 'tintas', nome: 'TINTAS' },
        { id: 'primer_verniz', nome: 'PRIMER E VERNIZ' },
        { id: 'complementos', nome: 'COMPLEMENTOS' },
    ]

    const [customGroups, setCustomGroups] = useState(DEFAULT_GROUPS)
    // Load clients on mount
    useEffect(() => {
        loadClientes()
    }, [])

    // Load group products and custom groups from localStorage when client changes
    useEffect(() => {
        if (clienteSelecionado) {
            const saved = localStorage.getItem(`groupProducts_${clienteSelecionado.id}`)
            if (saved) {
                try { setGroupProducts(JSON.parse(saved)) } catch { setGroupProducts({}) }
            } else {
                setGroupProducts({})
            }
            const savedGroups = localStorage.getItem(`customGroups_${clienteSelecionado.id}`)
            if (savedGroups) {
                try { setCustomGroups(JSON.parse(savedGroups)) } catch { setCustomGroups(DEFAULT_GROUPS) }
            } else {
                setCustomGroups(DEFAULT_GROUPS)
            }
        }
    }, [clienteSelecionado])

    const saveGroupProducts = (updated) => {
        setGroupProducts(updated)
        if (clienteSelecionado) {
            localStorage.setItem(`groupProducts_${clienteSelecionado.id}`, JSON.stringify(updated))
        }
    }

    const addProductToGroup = (groupId, produtoNome) => {
        const current = groupProducts[groupId] || []
        if (!current.includes(produtoNome)) {
            const updated = { ...groupProducts, [groupId]: [...current, produtoNome] }
            saveGroupProducts(updated)
        }
    }

    const removeProductFromGroup = (groupId, produtoNome) => {
        const current = groupProducts[groupId] || []
        const updated = { ...groupProducts, [groupId]: current.filter(p => p !== produtoNome) }
        saveGroupProducts(updated)
    }

    const saveCustomGroups = (groups) => {
        setCustomGroups(groups)
        if (clienteSelecionado) {
            localStorage.setItem(`customGroups_${clienteSelecionado.id}`, JSON.stringify(groups))
        }
    }

    const handleRenameGroup = (groupId, newName) => {
        if (!newName.trim()) return
        const updated = customGroups.map(g => g.id === groupId ? { ...g, nome: newName.trim().toUpperCase() } : g)
        saveCustomGroups(updated)
        setEditingGroupId(null)
        setEditingGroupName('')
        if (selectedGroup?.id === groupId) {
            setSelectedGroup({ ...selectedGroup, nome: newName.trim().toUpperCase() })
        }
    }

    const handleAddGroup = () => {
        const nome = prompt('Nome da nova sub pasta:')
        if (!nome || !nome.trim()) return
        const id = 'custom_' + Date.now()
        const newGroup = { id, nome: nome.trim().toUpperCase() }
        saveCustomGroups([...customGroups, newGroup])
    }

    const handleDeleteGroup = (groupId) => {
        if (!window.confirm('Tem certeza que deseja excluir esta sub pasta?')) return
        const updated = customGroups.filter(g => g.id !== groupId)
        saveCustomGroups(updated)
        // Also clean up associated products
        const updatedProducts = { ...groupProducts }
        delete updatedProducts[groupId]
        saveGroupProducts(updatedProducts)
    }

    // Load years when client changes
    useEffect(() => {
        if (clienteSelecionado) {
            loadAnos()
            loadFavoritos()
        } else {
            setAnos([])
            setAnoSelecionado(null)
        }
    }, [clienteSelecionado])

    // Load sales data when year changes
    useEffect(() => {
        if (clienteSelecionado && anoSelecionado) {
            loadVendas()
        } else {
            setVendas([])
            setMatrizData(null)
        }
        setSelectedFavorito(null)
    }, [clienteSelecionado, anoSelecionado])

    const loadClientes = async () => {
        try {
            const data = await db.getClientes(userId)
            setClientes(data)
            setError(null)
        } catch (err) {
            console.error('Failed to load clients', err)
            setError('Erro ao carregar clientes. Tente recarregar a página.')
        }
    }

    const loadAnos = async () => {
        if (!clienteSelecionado) return
        const anos = await salesService.getAnos(clienteSelecionado.id)
        setAnos(anos)
        if (anos.length > 0 && !anoSelecionado) {
            setAnoSelecionado(anos[0])
        }
    }

    const loadVendas = async () => {
        if (!clienteSelecionado || !anoSelecionado) return
        setLoading(true)
        try {
            const data = await salesService.getVendas(clienteSelecionado.id, anoSelecionado)
            setVendas(data)
            processMatriz(data)
        } catch (error) {
            console.error('Error loading sales:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadFavoritos = async () => {
        if (!clienteSelecionado) return
        const favs = await salesService.getFavoritos(clienteSelecionado.id)
        setFavoritos(favs)
    }

    const processMatriz = (vendasData) => {
        if (!vendasData || vendasData.length === 0) {
            setMatrizData(null)
            return
        }

        // Group by product and month
        const produtoMap = {}
        const mesesSet = new Set()

        vendasData.forEach(v => {
            const produtoKey = v.produto_nome || v.produto
            if (!produtoMap[produtoKey]) {
                produtoMap[produtoKey] = {
                    codigo: v.produto_codigo || v.produto
                }
            }
            produtoMap[produtoKey][v.mes_ref] = (produtoMap[produtoKey][v.mes_ref] || 0) + v.quantidade
            mesesSet.add(v.mes_ref)
        })

        // Sort months (Mês 01, Mês 02, etc.)
        const meses = Array.from(mesesSet).sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0')
            const numB = parseInt(b.match(/\d+/)?.[0] || '0')
            return numA - numB
        })

        // Create matrix
        const matriz = Object.entries(produtoMap).map(([produto, mesesData]) => {
            const row = { produto, codigo: mesesData.codigo }
            meses.forEach(mes => {
                row[mes] = mesesData[mes] || 0
            })
            return row
        })

        setMatrizData({ produtos: matriz, meses })
    }

    const [importConfirmation, setImportConfirmation] = useState(null)

    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return
        if (!clienteSelecionado || !anoSelecionado) {
            alert('Selecione um cliente e ano primeiro!')
            return
        }

        setUploadProgress({ current: 0, total: files.length, status: 'Analisando arquivos...' })

        // Phase 1: Pre-scan files
        const analysis = []
        const mesMap = {}
        const collisions = []

        for (const file of files) {
            try {
                // Peek content (first 5 lines) just to validate valid CSV
                // But for mes extraction we just need name and content length check
                const content = await readFileAsText(file)
                const { mes } = parseCSV(content, file.name)

                if (mes) {
                    if (mesMap[mes]) {
                        collisions.push({ mes, file1: mesMap[mes], file2: file.name })
                    }
                    mesMap[mes] = file.name
                }

                analysis.push({ file: file, name: file.name, mes: mes || 'Não detectado (Geral)' })
            } catch (error) {
                analysis.push({ file: file, name: file.name, mes: 'Erro', error: error.message })
            }
        }

        // Phase 2: Show confirmation
        setImportConfirmation({
            files: analysis,
            collisions: collisions,
            onConfirm: () => startImport(analysis)
        })
        setUploadProgress(null)
    }

    const startImport = async (filesAnalysis) => {
        setImportConfirmation(null)
        setUploadProgress({ current: 0, total: filesAnalysis.length })

        const allVendas = []
        let processedCount = 0

        for (const item of filesAnalysis) {
            if (item.mes === 'Erro') continue

            try {
                const content = await readFileAsText(item.file)
                const { data, mes } = parseCSV(content, item.name)

                // Delete existing data for this month
                await salesService.deleteVendasMes(clienteSelecionado.id, anoSelecionado, mes)

                // Prepare records
                const records = data.map(d => ({
                    cliente_id: clienteSelecionado.id,
                    ano_referencia: anoSelecionado,
                    arquivo_origem: item.name,
                    ...d,
                    valor_total: d.valor // Map parseCSV 'valor' to DB 'valor_total'
                }))

                allVendas.push(...records)
            } catch (error) {
                console.error(`Error processing ${item.name}:`, error)
                // Continue with other files logic?
            }
            processedCount++
            setUploadProgress({ current: processedCount, total: filesAnalysis.length })
        }

        setUploadProgress({ current: filesAnalysis.length, total: filesAnalysis.length, status: 'Salvando no banco de dados...' })

        // Import all at once
        if (allVendas.length > 0) {
            try {
                const result = await salesService.importVendas(
                    clienteSelecionado.id,
                    anoSelecionado,
                    allVendas,
                    (status) => setUploadProgress(prev => ({ ...prev, status }))
                )
                if (result.success) {
                    alert(`${allVendas.length} registros importados com sucesso!`)
                    loadVendas()
                    loadAnos() // Refresh years list
                } else {
                    alert(`Erro na importação: ${result.error}`)
                }
            } catch (error) {
                console.error('Critical import error:', error)
                alert(`Erro crítico ao salvar dados: ${error.message}`)
            }
        }

        setUploadProgress(null)
    }

    const handleToggleFavorito = async (produto) => {
        if (!clienteSelecionado) return
        await salesService.toggleFavorito(clienteSelecionado.id, produto)
        loadFavoritos()
    }

    const getCellColor = (produto, mes, meses) => {
        if (!matrizData || !meses) return ''

        const mesIndex = meses.indexOf(mes)
        if (mesIndex === 0) return '' // First month, no comparison

        const row = matrizData.produtos.find(p => p.produto === produto)
        if (!row) return ''

        const currentValue = row[mes] || 0
        const previousMes = meses[mesIndex - 1]
        const previousValue = row[previousMes] || 0

        if (currentValue > previousValue) return 'cell-up' // Blue - increased
        if (currentValue < previousValue && currentValue > 0) return 'cell-down' // Yellow - decreased
        if (currentValue === 0 && previousValue > 0) return 'cell-zero' // Red - stopped selling

        return ''
    }

    const getTopProdutos = (mes, limit = 5) => {
        if (!matrizData) return []
        return matrizData.produtos
            .filter(p => p[mes] > 0)
            .sort((a, b) => b[mes] - a[mes])
            .slice(0, limit)
    }

    const getBaixasProdutos = (mes, limit = 5) => {
        if (!matrizData) return []
        return matrizData.produtos
            .filter(p => p[mes] > 0)
            .sort((a, b) => a[mes] - b[mes])
            .slice(0, limit)
    }

    const getEmAlta = (mes, meses, limit = 5) => {
        if (!matrizData) return []
        const mesIndex = meses.indexOf(mes)
        if (mesIndex === 0) return []

        const previousMes = meses[mesIndex - 1]
        return matrizData.produtos
            .map(p => ({
                ...p,
                delta: (p[mes] || 0) - (p[previousMes] || 0)
            }))
            .filter(p => p.delta > 0)
            .sort((a, b) => b.delta - a.delta)
            .slice(0, limit)
    }

    const getEmQueda = (mes, meses, limit = 5) => {
        if (!matrizData) return []
        const mesIndex = meses.indexOf(mes)
        if (mesIndex === 0) return []

        const previousMes = meses[mesIndex - 1]
        return matrizData.produtos
            .map(p => ({
                ...p,
                delta: (p[mes] || 0) - (p[previousMes] || 0)
            }))
            .filter(p => p.delta < 0)
            .sort((a, b) => a.delta - b.delta)
            .slice(0, limit)
    }

    const handleAnaliseChange = (mesSel) => {
        setMesSelecionadoAnalise(mesSel)

        if (mesSel && matrizData) {
            const topProds = getTopProdutos(mesSel)
            const baixasProds = getBaixasProdutos(mesSel)
            const altaProds = getEmAlta(mesSel, matrizData.meses)
            const quedaProds = getEmQueda(mesSel, matrizData.meses)

            // Calculate totals
            const totalVendasMes = matrizData.produtos.reduce((sum, p) => sum + (p[mesSel] || 0), 0)
            const produtosVendidos = matrizData.produtos.filter(p => (p[mesSel] || 0) > 0).length

            setAnaliseData({
                mes: mesSel,
                top: topProds,
                baixas: baixasProds,
                alta: altaProds,
                queda: quedaProds,
                totalVendas: totalVendasMes,
                produtosVendidos: produtosVendidos,
                mediaVendas: produtosVendidos > 0 ? Math.round(totalVendasMes / produtosVendidos) : 0
            })
        } else {
            setAnaliseData(null)
        }
    }

    const produtosFiltrados = matrizData?.produtos.filter(p =>
        filtro === '' || p.produto.toLowerCase().includes(filtro.toLowerCase())
    )

    const produtosFavoritos = matrizData?.produtos?.filter(p => favoritos.includes(p.produto))



    const handleDeleteClient = async () => {
        if (!clienteSelecionado) return

        if (window.confirm(`Tem certeza que deseja excluir o cliente "${clienteSelecionado.nome}"? Todo o histórico de vendas será perdido.`)) {
            try {
                await db.deleteCliente(clienteSelecionado.id)
                alert('Cliente excluído com sucesso!')
                setClienteSelecionado(null)
                setAnos([])
                setAnoSelecionado(null)
                setVendas([])
                setMatrizData(null)
                loadClientes()
            } catch (error) {
                console.error('Erro ao excluir cliente:', error)
                alert('Erro ao excluir cliente. Verifique se existem dados vinculados.')
            }
        }
    }

    return (
        <div className="sales-analysis">
            <div className="sales-controls-header">
                <div>
                    <h2>📊 Dashboard de Vendas</h2>
                    <p className="sales-subtitle">Análise de vendas mês a mês</p>
                </div>
            </div>

            {/* Client and Year Selection */}
            {error && <div className="error-banner">{error}</div>}
            <Card glass className="sales-controls">
                <div className="sales-selects">
                    <div className="input-group">
                        <div className="input-wrapper">
                            <label className="input-label">Cliente</label>
                            <select
                                className="input"
                                style={{ padding: 'var(--space-4)' }}
                                value={clienteSelecionado?.id || ''}
                                onChange={(e) => {
                                    const cliente = clientes.find(c => c.id === parseInt(e.target.value))
                                    setClienteSelecionado(cliente || null)
                                }}
                            >
                                <option value="">Selecione um cliente...</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                            </select>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={async () => {
                                const nome = prompt('Nome do novo cliente:')
                                if (nome) {
                                    try {
                                        const clienteData = { nome }
                                        if (userId) clienteData.usuario_id = userId

                                        const novoCliente = await db.createCliente(clienteData)
                                        if (novoCliente) {
                                            await loadClientes()
                                            setClienteSelecionado(novoCliente)
                                            alert('Cliente criado com sucesso!')
                                        }
                                    } catch (error) {
                                        console.error('Erro ao criar cliente:', error)
                                        alert('Erro ao criar cliente')
                                    }
                                }
                            }}
                            title="Novo Cliente"
                        >
                            ➕
                        </Button>
                        {clienteSelecionado && (
                            <Button
                                variant="danger"
                                onClick={handleDeleteClient}
                                title="Excluir Cliente"
                                style={{ marginLeft: 'var(--space-2)' }}
                            >
                                🗑️
                            </Button>
                        )}
                    </div>

                    {clienteSelecionado && (
                        <div className="input-group">
                            <div className="input-wrapper">
                                <label className="input-label">Ano</label>
                                <select
                                    className="input"
                                    style={{ padding: 'var(--space-4)' }}
                                    value={anoSelecionado || ''}
                                    onChange={(e) => setAnoSelecionado(parseInt(e.target.value) || null)}
                                >
                                    <option value="">Selecione um ano...</option>
                                    {anos.map(ano => (
                                        <option key={ano} value={ano}>📁 {ano}</option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={async () => {
                                    const ano = prompt('Digite o ano (ex: 2025):')
                                    if (ano && !isNaN(ano)) {
                                        try {
                                            const result = await salesService.createAno(clienteSelecionado.id, parseInt(ano))
                                            if (result) {
                                                await loadAnos()
                                                setAnoSelecionado(parseInt(ano))
                                                alert('Pasta do ano criada com sucesso!')
                                            } else {
                                                alert('Pasta do ano já existe ou houve um erro.')
                                            }
                                        } catch (error) {
                                            console.error('Erro ao criar ano:', error)
                                            alert('Erro ao criar pasta do ano')
                                        }
                                    }
                                }}
                                title="Nova Pasta de Ano"
                            >
                                📁 Criar Pasta do Ano
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {clienteSelecionado && anoSelecionado && (
                <>
                    {/* Tabs */}
                    <div className="admin-tabs">
                        <button
                            className={`admin-tab ${activeTab === 'dashboard' ? 'admin-tab--active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            📊 Dashboard
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'import' ? 'admin-tab--active' : ''}`}
                            onClick={() => setActiveTab('import')}
                        >
                            📤 Importar CSV
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'matriz' ? 'admin-tab--active' : ''}`}
                            onClick={() => setActiveTab('matriz')}
                        >
                            📋 Matriz Financeira
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'favoritos' ? 'admin-tab--active' : ''}`}
                            onClick={() => setActiveTab('favoritos')}
                        >
                            ⭐ Essenciais
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'analise' ? 'admin-tab--active' : ''}`}
                            onClick={() => setActiveTab('analise')}
                        >
                            🔎 Análise Mensal
                        </button>
                    </div>

                    <div className="sales-content">
                        {/* Dashboard Tab */}
                        {activeTab === 'dashboard' && (
                            <ClientDashboard
                                matrizData={matrizData}
                                vendas={vendas}
                                cliente={clienteSelecionado}
                                ano={anoSelecionado}
                                favoritos={favoritos} // Passando favoritos (Essenciais)
                                onToggleFavorito={handleToggleFavorito} // Para poder remover dos favoritos
                            />
                        )}

                        {/* Import Tab */}
                        {activeTab === 'import' && (
                            <Card>
                                <h3>Importar Arquivos CSV</h3>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
                                    Arraste ou selecione os arquivos CSV de vendas. O mês será detectado automaticamente pelo nome do arquivo.
                                </p>
                                <input
                                    type="file"
                                    multiple
                                    accept=".csv"
                                    onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                                    style={{ marginBottom: 'var(--space-4)' }}
                                />
                                {uploadProgress && (
                                    <div className="upload-progress">
                                        <p>{uploadProgress.status || `Processando arquivo ${uploadProgress.current} de ${uploadProgress.total}...`}</p>
                                        <div className="loading-spinner"></div>
                                    </div>
                                )}

                                {/* Confirmation Modal */}
                                {importConfirmation && (
                                    <div className="modal-overlay">
                                        <Card className="modal-content" style={{ maxWidth: '600px' }}>
                                            <h3>📋 Confirmar Importação</h3>
                                            <p>Analise como os arquivos serão processados:</p>

                                            {importConfirmation.collisions.length > 0 && (
                                                <div className="alert-box error">
                                                    <strong>⚠️ Atenção! Conflitos detectados:</strong>
                                                    <ul>
                                                        {importConfirmation.collisions.map((c, idx) => (
                                                            <li key={idx}>O mês <strong>{c.mes}</strong> aparece em mais de um arquivo ({c.file1} e {c.file2}). O último sobrescreverá o primeiro.</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="file-preview-list" style={{ maxHeight: '300px', overflowY: 'auto', margin: '1rem 0' }}>
                                                <table style={{ width: '100%', fontSize: '0.9rem' }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ textAlign: 'left' }}>Arquivo</th>
                                                            <th style={{ textAlign: 'left' }}>Mês Detectado</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {importConfirmation.files.map((f, idx) => (
                                                            <tr key={idx} style={{
                                                                color: f.mes === 'Erro' ? 'var(--color-danger)' :
                                                                    f.mes.includes('Geral') ? 'var(--color-warning)' : 'inherit'
                                                            }}>
                                                                <td>{f.name}</td>
                                                                <td>
                                                                    {f.mes}
                                                                    {f.error && <span style={{ display: 'block', fontSize: '0.8em' }}>{f.error}</span>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                                <Button variant="secondary" onClick={() => setImportConfirmation(null)}>
                                                    Cancelar
                                                </Button>
                                                <Button onClick={importConfirmation.onConfirm}>
                                                    Confirmar e Importar
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                {vendas.length > 0 && (
                                    <div className="import-stats">
                                        <p>✅ Total de registros: <strong>{vendas.length}</strong></p>
                                        <p>📦 Produtos únicos: <strong>{matrizData?.produtos.length || 0}</strong></p>
                                        <p>📅 Meses com dados: <strong>{matrizData?.meses.length || 0}</strong></p>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Matriz Tab */}
                        {activeTab === 'matriz' && (
                            <div>
                                {!selectedGroup ? (
                                    /* Nível 1 — Grid de Grupos */
                                    <div>
                                        <div className="matriz-controls">
                                            <Input
                                                placeholder="Filtrar produto (tabela geral)..."
                                                value={filtro}
                                                onChange={(e) => setFiltro(e.target.value)}
                                                icon={<span>🔍</span>}
                                            />
                                        </div>

                                        {/* Grupos Grid */}
                                        <div className="grupos-grid">
                                            {/* TODOS PRODUTOS - always first */}
                                            {(() => {
                                                const todosGrupo = { id: 'todos', nome: 'TODOS PRODUTOS' }
                                                const produtosDoGrupo = matrizData?.produtos || []
                                                const totalUnidades = produtosDoGrupo.reduce((sum, p) => {
                                                    return sum + (matrizData?.meses || []).reduce((s, m) => s + (p[m] || 0), 0)
                                                }, 0)
                                                return (
                                                    <Card
                                                        key="todos"
                                                        className="grupo-card"
                                                        hover
                                                        onClick={() => {
                                                            setSelectedGroup(todosGrupo)
                                                            setGroupSearchTerm('')
                                                        }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="grupo-card-content">
                                                            <h4>{todosGrupo.nome}</h4>
                                                            <p className="grupo-stats">{produtosDoGrupo.length} produtos</p>
                                                            <p className="grupo-total">{totalUnidades} un. total</p>
                                                        </div>
                                                    </Card>
                                                )
                                            })()}

                                            {/* Dynamic subfolders */}
                                            {customGroups.map(grupo => {
                                                const savedNames = groupProducts[grupo.id] || []
                                                const produtosDoGrupo = (matrizData?.produtos || []).filter(p => savedNames.includes(p.produto))
                                                const totalUnidades = produtosDoGrupo.reduce((sum, p) => {
                                                    return sum + (matrizData?.meses || []).reduce((s, m) => s + (p[m] || 0), 0)
                                                }, 0)
                                                return (
                                                    <Card
                                                        key={grupo.id}
                                                        className="grupo-card"
                                                        hover
                                                        onClick={() => {
                                                            if (editingGroupId !== grupo.id) {
                                                                setSelectedGroup(grupo)
                                                                setGroupSearchTerm('')
                                                            }
                                                        }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="grupo-card-content">
                                                            {editingGroupId === grupo.id ? (
                                                                <input
                                                                    className="grupo-edit-input"
                                                                    value={editingGroupName}
                                                                    onChange={(e) => setEditingGroupName(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleRenameGroup(grupo.id, editingGroupName)
                                                                        if (e.key === 'Escape') { setEditingGroupId(null); setEditingGroupName('') }
                                                                    }}
                                                                    onBlur={() => handleRenameGroup(grupo.id, editingGroupName)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    autoFocus
                                                                />
                                                            ) : (
                                                                <h4>{grupo.nome}</h4>
                                                            )}
                                                            <p className="grupo-stats">{produtosDoGrupo.length} produtos</p>
                                                            <p className="grupo-total">{totalUnidades} un. total</p>
                                                            <div className="grupo-actions">
                                                                <button
                                                                    className="grupo-action-btn edit"
                                                                    title="Renomear sub pasta"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setEditingGroupId(grupo.id)
                                                                        setEditingGroupName(grupo.nome)
                                                                    }}
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    className="grupo-action-btn delete"
                                                                    title="Excluir sub pasta"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDeleteGroup(grupo.id)
                                                                    }}
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                )
                                            })}

                                            {/* Add new subfolder card */}
                                            <Card
                                                className="grupo-card grupo-card-add"
                                                hover
                                                onClick={handleAddGroup}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="grupo-card-content">
                                                    <span className="grupo-add-icon">➕</span>
                                                    <h4>Nova Sub Pasta</h4>
                                                </div>
                                            </Card>
                                        </div>

                                        {/* Tabela geral (filtrada) abaixo dos grupos */}
                                        {matrizData && produtosFiltrados && filtro.length > 0 && (
                                            <div className="matriz-container" style={{ marginTop: 'var(--space-6)' }}>
                                                <table className="matriz-table">
                                                    <thead>
                                                        <tr>
                                                            <th className="produto-col">Produto</th>
                                                            {matrizData.meses.map(mes => (
                                                                <th key={mes}>{mes}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {produtosFiltrados.map((produto, idx) => (
                                                            <tr key={idx}>
                                                                <td className="produto-col">{produto.produto}</td>
                                                                {matrizData.meses.map(mes => (
                                                                    <td key={mes} className={getCellColor(produto.produto, mes, matrizData.meses)}>
                                                                        {produto[mes] || 0}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {!matrizData && (
                                            <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                Nenhum dado de vendas. Importe os arquivos CSV primeiro.
                                            </p></Card>
                                        )}
                                    </div>
                                ) : (
                                    /* Nível 2 — Dentro do Grupo */
                                    <div className="grupo-detail">
                                        <div className="detail-header">
                                            <h3>{selectedGroup.nome}</h3>
                                            <Button variant="ghost" onClick={() => setSelectedGroup(null)}>← Voltar aos Grupos</Button>
                                        </div>

                                        {selectedGroup.id === 'todos' && (
                                            /* Search for TODOS PRODUTOS - view only, no add button */
                                            <div className="matriz-controls" style={{ position: 'relative' }}>
                                                <Input
                                                    placeholder="🔍 Buscar produto..."
                                                    value={groupSearchTerm}
                                                    onChange={(e) => setGroupSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        )}

                                        {selectedGroup.id !== 'todos' && (
                                            <>
                                                {/* Search to ADD products */}
                                                <div className="matriz-controls" style={{ position: 'relative' }}>
                                                    <Input
                                                        placeholder={`🔍 Buscar produto para adicionar em ${selectedGroup.nome}...`}
                                                        value={groupSearchTerm}
                                                        onChange={(e) => setGroupSearchTerm(e.target.value)}
                                                    />
                                                </div>

                                                {/* Search Results with + button */}
                                                {groupSearchTerm.length > 0 && (() => {
                                                    const savedNames = groupProducts[selectedGroup.id] || []
                                                    const results = (matrizData?.produtos || []).filter(p =>
                                                        p.produto.toLowerCase().includes(groupSearchTerm.toLowerCase())
                                                    ).sort((a, b) => a.produto.localeCompare(b.produto))
                                                    return results.length > 0 ? (
                                                        <Card className="search-results-card">
                                                            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                                                                {results.length} resultado(s) — clique ➕ para adicionar à pasta
                                                            </p>
                                                            <div className="search-results-list">
                                                                {results.map((p, idx) => {
                                                                    const isAdded = savedNames.includes(p.produto)
                                                                    return (
                                                                        <div key={idx} className={`search-result-item ${isAdded ? 'already-added' : ''}`}>
                                                                            <span className="search-result-name">{p.produto}</span>
                                                                            {isAdded ? (
                                                                                <span className="added-badge">✅ Adicionado</span>
                                                                            ) : (
                                                                                <button
                                                                                    className="add-product-btn"
                                                                                    onClick={() => addProductToGroup(selectedGroup.id, p.produto)}
                                                                                    title="Adicionar à pasta"
                                                                                >
                                                                                    ➕
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </Card>
                                                    ) : (
                                                        <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum produto encontrado.</p></Card>
                                                    )
                                                })()}
                                            </>
                                        )}

                                        {(() => {
                                            // Get products for this group
                                            let produtosDoGrupo
                                            if (selectedGroup.id === 'todos') {
                                                produtosDoGrupo = [...(matrizData?.produtos || [])]
                                                    .filter(p => !groupSearchTerm || p.produto.toLowerCase().includes(groupSearchTerm.toLowerCase()))
                                                    .sort((a, b) => a.produto.localeCompare(b.produto))
                                            } else {
                                                const savedNames = groupProducts[selectedGroup.id] || []
                                                produtosDoGrupo = (matrizData?.produtos || []).filter(p => savedNames.includes(p.produto)).sort((a, b) => a.produto.localeCompare(b.produto))
                                            }

                                            const meses = matrizData?.meses || []

                                            // Chart data: total of group per month
                                            const chartData = {
                                                labels: meses,
                                                datasets: [{
                                                    label: `Vendas - ${selectedGroup.nome}`,
                                                    data: meses.map(m => produtosDoGrupo.reduce((sum, p) => sum + (p[m] || 0), 0)),
                                                    borderColor: 'rgba(59, 130, 246, 1)',
                                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                    tension: 0.4,
                                                    fill: true,
                                                    pointRadius: 5,
                                                    pointHoverRadius: 8,
                                                }]
                                            }

                                            const chartOptions = {
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { display: false },
                                                    title: {
                                                        display: true,
                                                        text: `Desempenho de Vendas - ${selectedGroup.nome}`,
                                                        color: 'rgba(255,255,255,0.9)',
                                                        font: { size: 16, weight: 'bold' }
                                                    },
                                                    tooltip: {
                                                        backgroundColor: 'rgba(0,0,0,0.85)',
                                                        titleFont: { size: 14 },
                                                        bodyFont: { size: 13 },
                                                    }
                                                },
                                                scales: {
                                                    x: {
                                                        ticks: { color: 'rgba(255,255,255,0.7)' },
                                                        grid: { color: 'rgba(255,255,255,0.05)' }
                                                    },
                                                    y: {
                                                        beginAtZero: true,
                                                        ticks: { color: 'rgba(255,255,255,0.7)' },
                                                        grid: { color: 'rgba(255,255,255,0.08)' }
                                                    }
                                                }
                                            }

                                            return (
                                                <>
                                                    {/* Summary Cards */}
                                                    <div className="grupo-summary">
                                                        <Card className="grupo-summary-card">
                                                            <span className="stat-icon">📦</span>
                                                            <div>
                                                                <p className="stat-label">Produtos</p>
                                                                <h2 className="stat-value">{produtosDoGrupo.length}</h2>
                                                            </div>
                                                        </Card>
                                                        <Card className="grupo-summary-card">
                                                            <span className="stat-icon">📊</span>
                                                            <div>
                                                                <p className="stat-label">Total Vendido</p>
                                                                <h2 className="stat-value">{produtosDoGrupo.reduce((sum, p) => meses.reduce((s, m) => s + (p[m] || 0), sum), 0)}</h2>
                                                            </div>
                                                        </Card>
                                                        <Card className="grupo-summary-card">
                                                            <span className="stat-icon">📅</span>
                                                            <div>
                                                                <p className="stat-label">Meses</p>
                                                                <h2 className="stat-value">{meses.length}</h2>
                                                            </div>
                                                        </Card>
                                                    </div>

                                                    {/* Chart */}
                                                    {meses.length > 0 && produtosDoGrupo.length > 0 && (
                                                        <Card className="grupo-chart-card">
                                                            <div style={{ height: '300px' }}>
                                                                <Line data={chartData} options={chartOptions} />
                                                            </div>
                                                        </Card>
                                                    )}

                                                    {/* Sales Analysis: Drops & Stopped — ALL months */}
                                                    {produtosDoGrupo.length > 0 && meses.length >= 2 && (() => {
                                                        const primeiroMes = meses[0]
                                                        const ultimoMes = meses[meses.length - 1]

                                                        // Products with overall declining trend (first month vs last month)
                                                        const emQueda = produtosDoGrupo
                                                            .map(p => {
                                                                const primeiro = p[primeiroMes] || 0
                                                                const ultimo = p[ultimoMes] || 0
                                                                const diffGeral = primeiro > 0 ? Math.round(((ultimo - primeiro) / primeiro) * 100) : 0

                                                                // Count how many months had drops vs previous month
                                                                let quedas = 0
                                                                for (let i = 1; i < meses.length; i++) {
                                                                    const curr = p[meses[i]] || 0
                                                                    const prev = p[meses[i - 1]] || 0
                                                                    if (curr < prev && prev > 0) quedas++
                                                                }

                                                                // Build month-by-month values
                                                                const valores = meses.map(m => p[m] || 0)

                                                                return { nome: p.produto, primeiro, ultimo, diffGeral, quedas, valores }
                                                            })
                                                            .filter(p => p.primeiro > 0 && p.ultimo < p.primeiro)
                                                            .sort((a, b) => a.diffGeral - b.diffGeral)

                                                        // Products that stopped being purchased (0 in last month but had sales before)
                                                        const parouDeComprar = produtosDoGrupo
                                                            .filter(p => {
                                                                const ultimo = p[ultimoMes] || 0
                                                                if (ultimo > 0) return false
                                                                return meses.slice(0, -1).some(m => (p[m] || 0) > 0)
                                                            })
                                                            .map(p => {
                                                                const ultimaCompra = [...meses].reverse().find(m => (p[m] || 0) > 0)
                                                                const totalAnterior = meses.reduce((s, m) => s + (p[m] || 0), 0)
                                                                return { nome: p.produto, ultimaCompra, totalAnterior }
                                                            })
                                                            .sort((a, b) => b.totalAnterior - a.totalAnterior)

                                                        return (emQueda.length > 0 || parouDeComprar.length > 0) ? (
                                                            <div className="analise-grupo-section">
                                                                <h4 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }}>
                                                                    📉 Análise de Vendas — Todos os Meses ({primeiroMes} a {ultimoMes})
                                                                </h4>

                                                                <div className="analise-grid">
                                                                    {/* Produtos em queda geral */}
                                                                    {emQueda.length > 0 && (
                                                                        <Card className="analise-card queda">
                                                                            <h5 className="analise-card-title">⚠️ Produtos em Queda Geral ({emQueda.length})</h5>
                                                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                                                                                Comparação {primeiroMes} vs {ultimoMes}
                                                                            </p>
                                                                            <div className="analise-list">
                                                                                {emQueda.map((p, i) => (
                                                                                    <div key={i} className="analise-item">
                                                                                        <span className="analise-item-name">{p.nome}</span>
                                                                                        <div className="analise-item-info">
                                                                                            <span className="analise-valores">{p.primeiro} → {p.ultimo}</span>
                                                                                            <span className="analise-badge queda">{p.diffGeral}%</span>
                                                                                            <span className="analise-badge quedas-count">{p.quedas} queda{p.quedas !== 1 ? 's' : ''}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </Card>
                                                                    )}

                                                                    {/* Parou de comprar */}
                                                                    {parouDeComprar.length > 0 && (
                                                                        <Card className="analise-card parou">
                                                                            <h5 className="analise-card-title">🚫 Parou de Comprar ({parouDeComprar.length})</h5>
                                                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                                                                                Produtos com 0 vendas em {ultimoMes}
                                                                            </p>
                                                                            <div className="analise-list">
                                                                                {parouDeComprar.map((p, i) => (
                                                                                    <div key={i} className="analise-item">
                                                                                        <span className="analise-item-name">{p.nome}</span>
                                                                                        <div className="analise-item-info">
                                                                                            <span className="analise-valores">Total: {p.totalAnterior} un.</span>
                                                                                            <span className="analise-badge parou">Última: {p.ultimaCompra}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </Card>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : null
                                                    })()}

                                                    {/* Table */}
                                                    {produtosDoGrupo.length > 0 ? (
                                                        <div className="matriz-container">
                                                            <table className="matriz-table">
                                                                <thead>
                                                                    <tr>
                                                                        {selectedGroup.id !== 'todos' && <th style={{ width: '40px' }}></th>}
                                                                        <th className="produto-col">Produto</th>
                                                                        {meses.map(mes => (
                                                                            <th key={mes}>{mes}</th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {produtosDoGrupo.map((produto, idx) => (
                                                                        <tr key={idx}>
                                                                            {selectedGroup.id !== 'todos' && (
                                                                                <td>
                                                                                    <button
                                                                                        className="remove-product-btn"
                                                                                        onClick={() => removeProductFromGroup(selectedGroup.id, produto.produto)}
                                                                                        title="Remover da pasta"
                                                                                    >
                                                                                        ✕
                                                                                    </button>
                                                                                </td>
                                                                            )}
                                                                            <td className="produto-col">{produto.produto}</td>
                                                                            {meses.map(mes => (
                                                                                <td key={mes} className={getCellColor(produto.produto, mes, meses)}>
                                                                                    {produto[mes] || 0}
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                            {selectedGroup.id === 'todos' ? 'Nenhum dado de vendas.' : 'Nenhum produto adicionado. Use a busca acima para adicionar produtos a esta pasta.'}
                                                        </p></Card>
                                                    )}
                                                </>
                                            )
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Favoritos Tab */}
                        {activeTab === 'favoritos' && (
                            <div>
                                <div className="favoritos-actions">
                                    {!selectedFavorito && (
                                        <div className="input-wrapper" style={{ position: 'relative' }}>
                                            <label className="input-label">🔍 Buscar para adicionar aos essenciais</label>
                                            <Input
                                                placeholder="Digite o nome do produto..."
                                                value={searchTermFavoritos}
                                                onChange={(e) => setSearchTermFavoritos(e.target.value)}
                                            />

                                            {searchTermFavoritos.length > 0 && (
                                                <div className="search-results-dropdown">
                                                    {matrizData?.produtos
                                                        .filter(p =>
                                                            p.produto.toLowerCase().includes(searchTermFavoritos.toLowerCase()) &&
                                                            !favoritos.includes(p.produto)
                                                        )
                                                        .slice(0, 10) // Limit results
                                                        .map((p, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="search-result-item"
                                                                onClick={() => {
                                                                    handleToggleFavorito(p.produto)
                                                                    setSearchTermFavoritos('')
                                                                }}
                                                            >
                                                                <span>{p.produto}</span>
                                                                <span className="plus-icon">➕</span>
                                                            </div>
                                                        ))}
                                                    {matrizData?.produtos.filter(p =>
                                                        p.produto.toLowerCase().includes(searchTermFavoritos.toLowerCase()) &&
                                                        !favoritos.includes(p.produto)
                                                    ).length === 0 && (
                                                            <div className="search-result-empty">Nenhum produto encontrado</div>
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {selectedFavorito && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => setSelectedFavorito(null)}
                                            style={{ marginBottom: 'var(--space-4)' }}
                                        >
                                            ← Voltar para Lista
                                        </Button>
                                    )}
                                </div>

                                {selectedFavorito ? (
                                    // DETAILED VIEW FOR SELECTED FAVORITE
                                    (() => {
                                        const produtoData = matrizData?.produtos?.find(p => p.produto === selectedFavorito)
                                        if (!produtoData) return <div>Produto não encontrado nos dados deste ano.</div>

                                        // Prepare Chart Data
                                        const labels = matrizData?.meses || []
                                        const dataValues = labels.map(mes => produtoData[mes] || 0)

                                        const chartData = {
                                            labels,
                                            datasets: [
                                                {
                                                    label: 'Vendas Mensais',
                                                    data: dataValues,
                                                    fill: true,
                                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                                    borderColor: 'rgba(59, 130, 246, 1)',
                                                    tension: 0.4
                                                }
                                            ]
                                        }

                                        const chartOptions = {
                                            responsive: true,
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    callbacks: {
                                                        label: (context) => `Vendas: ${context.raw}`
                                                    }
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                                    ticks: { color: '#9ca3af' }
                                                },
                                                x: {
                                                    grid: { display: false },
                                                    ticks: { color: '#9ca3af' }
                                                }
                                            }
                                        }

                                        // Calculate stats
                                        const totalVendas = dataValues.reduce((a, b) => a + b, 0)
                                        const mesesComVenda = dataValues.filter(v => v > 0).length
                                        const mediaMensal = mesesComVenda > 0 ? Math.round(totalVendas / mesesComVenda) : 0

                                        // Trend
                                        const firstHalf = dataValues.slice(0, Math.ceil(dataValues.length / 2)).reduce((a, b) => a + b, 0)
                                        const secondHalf = dataValues.slice(Math.ceil(dataValues.length / 2)).reduce((a, b) => a + b, 0)
                                        const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0

                                        return (
                                            <div className="favorito-detail">
                                                <div className="detail-header">
                                                    <h3>⭐ {selectedFavorito}</h3>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => {
                                                            handleToggleFavorito(selectedFavorito)
                                                            setSelectedFavorito(null)
                                                        }}
                                                    >
                                                        Remover dos Favoritos
                                                    </Button>
                                                </div>

                                                <div className="stats-row" style={{ marginTop: 'var(--space-4)' }}>
                                                    <Card className="stat-card">
                                                        <div className="stat-icon blue">💰</div>
                                                        <div className="stat-info">
                                                            <span className="stat-label-dash">Total</span>
                                                            <h3 className="stat-value-dash">{totalVendas}</h3>
                                                        </div>
                                                    </Card>
                                                    <Card className="stat-card">
                                                        <div className="stat-icon green">📅</div>
                                                        <div className="stat-info">
                                                            <span className="stat-label-dash">Média Mensal</span>
                                                            <h3 className="stat-value-dash">{mediaMensal}</h3>
                                                        </div>
                                                    </Card>
                                                    <Card className="stat-card">
                                                        <div className="stat-icon orange">📈</div>
                                                        <div className="stat-info">
                                                            <span className="stat-label-dash">Tendência 2º Sem.</span>
                                                            <h3 className="stat-value-dash" style={{ color: trend >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                                {trend > 0 ? '+' : ''}{Math.round(trend)}%
                                                            </h3>
                                                        </div>
                                                    </Card>
                                                </div>

                                                <Card className="chart-card" style={{ marginTop: 'var(--space-6)' }}>
                                                    <h4 className="chart-title">Desempenho Anual</h4>
                                                    <div className="chart-container" style={{ height: '300px' }}>
                                                        <Line data={chartData} options={chartOptions} />
                                                    </div>
                                                </Card>
                                            </div>
                                        )
                                    })()
                                ) : (
                                    // LIST VIEW
                                    produtosFavoritos && produtosFavoritos.length > 0 ? (
                                        <div className="favoritos-grid-list">
                                            {produtosFavoritos.map((produto, idx) => {
                                                // Quick stats for card
                                                const total = matrizData.meses.reduce((sum, m) => sum + (produto[m] || 0), 0)
                                                // Check trend
                                                const last3Months = matrizData.meses.slice(-3).reduce((sum, m) => sum + (produto[m] || 0), 0)
                                                const isStopped = last3Months === 0 && total > 0

                                                return (
                                                    <Card
                                                        key={idx}
                                                        className={`favorito-item-card ${isStopped ? 'stopped' : ''}`}
                                                        onClick={() => setSelectedFavorito(produto.produto)}
                                                        style={{ cursor: 'pointer', transition: 'transform 0.2s', borderLeft: isStopped ? '4px solid var(--color-danger)' : '4px solid var(--color-primary)' }}
                                                    >
                                                        <div className="favorito-card-content">
                                                            <div className="favorito-info">
                                                                <h4>⭐ {produto.produto}</h4>
                                                                <span className="favorito-total">Total: {total} un</span>
                                                            </div>
                                                            <div className="favorito-status">
                                                                {isStopped ? (
                                                                    <span className="status-badge danger">Parou de Vender</span>
                                                                ) : (
                                                                    <span className="status-badge success">Ativo</span>
                                                                )}
                                                                <span className="click-hint">Ver detalhes →</span>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                            Nenhum produto marcado como essencial. Use o seletor acima para adicionar.
                                        </p></Card>
                                    )
                                )}
                            </div>
                        )}

                        {/* Análise Tab - MELHORADA */}
                        {activeTab === 'analise' && matrizData && (
                            <div>
                                <div className="input-wrapper" style={{ maxWidth: '300px', marginBottom: 'var(--space-6)' }}>
                                    <label className="input-label">Mês para Análise</label>
                                    <select
                                        className="input"
                                        style={{ padding: 'var(--space-4)' }}
                                        value={mesSelecionadoAnalise || ''}
                                        onChange={(e) => handleAnaliseChange(e.target.value)}
                                    >
                                        <option value="">Selecione um mês...</option>
                                        {matrizData.meses.map(mes => (
                                            <option key={mes} value={mes}>{mes}</option>
                                        ))}
                                    </select>
                                </div>

                                {analiseData ? (
                                    <>
                                        {/* Summary Cards */}
                                        <div className="analise-summary">
                                            <Card className="summary-card">
                                                <span className="summary-icon">📦</span>
                                                <div>
                                                    <p className="summary-label">Total de Peças</p>
                                                    <h3 className="summary-value">{analiseData.totalVendas.toLocaleString('pt-BR')}</h3>
                                                </div>
                                            </Card>
                                            <Card className="summary-card">
                                                <span className="summary-icon">🎯</span>
                                                <div>
                                                    <p className="summary-label">Produtos Vendidos</p>
                                                    <h3 className="summary-value">{analiseData.produtosVendidos}</h3>
                                                </div>
                                            </Card>
                                            <Card className="summary-card">
                                                <span className="summary-icon">📊</span>
                                                <div>
                                                    <p className="summary-label">Média por Produto</p>
                                                    <h3 className="summary-value">{analiseData.mediaVendas}</h3>
                                                </div>
                                            </Card>
                                        </div>

                                        {/* Detailed Analysis */}
                                        <div className="analise-grid">
                                            <Card className="analise-card">
                                                <h4>🏆 Top 5 Campeões de {analiseData.mes}</h4>
                                                <p className="analise-description">Produtos mais vendidos do mês</p>
                                                {analiseData.top.length > 0 ? (
                                                    <div className="analise-list">
                                                        {analiseData.top.map((prod, idx) => (
                                                            <div key={idx} className="analise-item">
                                                                <span className="analise-rank">#{idx + 1}</span>
                                                                <div className="analise-item-content">
                                                                    <strong>{prod.produto}</strong>
                                                                    <span className="analise-value">{prod[analiseData.mes]} peças</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="no-data">Nenhuma venda neste mês</p>
                                                )}
                                            </Card>

                                            <Card className="analise-card">
                                                <h4>⚠️ Vendas Baixas</h4>
                                                <p className="analise-description">Produtos com menor volume</p>
                                                {analiseData.baixas.length > 0 ? (
                                                    <div className="analise-list">
                                                        {analiseData.baixas.map((prod, idx) => (
                                                            <div key={idx} className="analise-item warning">
                                                                <span className="analise-rank">⚠️</span>
                                                                <div className="analise-item-content">
                                                                    <strong>{prod.produto}</strong>
                                                                    <span className="analise-value">{prod[analiseData.mes]} peças</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="no-data">Dados insuficientes</p>
                                                )}
                                            </Card>

                                            <Card className="analise-card">
                                                <h4>🚀 Em Alta (vs Mês Anterior)</h4>
                                                <p className="analise-description">Produtos com maior crescimento</p>
                                                {analiseData.alta.length > 0 ? (
                                                    <div className="analise-list">
                                                        {analiseData.alta.map((prod, idx) => {
                                                            const mesIndex = matrizData.meses.indexOf(analiseData.mes)
                                                            const mesAnterior = matrizData.meses[mesIndex - 1]
                                                            return (
                                                                <div key={idx} className="analise-item success">
                                                                    <span className="analise-rank">📈</span>
                                                                    <div className="analise-item-content">
                                                                        <strong>{prod.produto}</strong>
                                                                        <span className="analise-change">
                                                                            {prod[mesAnterior]} → {prod[analiseData.mes]}
                                                                            <span className="delta-up"> (+{prod.delta})</span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="no-data">Nenhum produto em alta</p>
                                                )}
                                            </Card>

                                            <Card className="analise-card">
                                                <h4>🔻 Em Queda (vs Mês Anterior)</h4>
                                                <p className="analise-description">Produtos com maior queda</p>
                                                {analiseData.queda.length > 0 ? (
                                                    <div className="analise-list">
                                                        {analiseData.queda.map((prod, idx) => {
                                                            const mesIndex = matrizData.meses.indexOf(analiseData.mes)
                                                            const mesAnterior = matrizData.meses[mesIndex - 1]
                                                            return (
                                                                <div key={idx} className="analise-item danger">
                                                                    <span className="analise-rank">📉</span>
                                                                    <div className="analise-item-content">
                                                                        <strong>{prod.produto}</strong>
                                                                        <span className="analise-change">
                                                                            {prod[mesAnterior]} → {prod[analiseData.mes]}
                                                                            <span className="delta-down"> ({prod.delta})</span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="no-data">Nenhum produto em queda</p>
                                                )}
                                            </Card>
                                        </div>

                                        {/* Insights */}
                                        <Card className="insights-card">
                                            <h4>💡 Insights Inteligentes</h4>
                                            <div className="insights-list">
                                                {analiseData.top.length > 0 && (
                                                    <div className="insight-item">
                                                        <span className="insight-icon">🏆</span>
                                                        <p>
                                                            <strong>{analiseData.top[0].produto}</strong> é o produto campeão com{' '}
                                                            <strong>{analiseData.top[0][analiseData.mes]} peças vendidas</strong>
                                                            {analiseData.top.length > 1 && (
                                                                <>, seguido por <strong>{analiseData.top[1].produto}</strong> ({analiseData.top[1][analiseData.mes]} peças)</>
                                                            )}.
                                                        </p>
                                                    </div>
                                                )}

                                                {analiseData.alta.length > 0 && (
                                                    <div className="insight-item">
                                                        <span className="insight-icon">📈</span>
                                                        <p>
                                                            Destaque de crescimento: <strong>{analiseData.alta[0].produto}</strong> cresceu{' '}
                                                            <strong className="text-success">+{analiseData.alta[0].delta} peças</strong> em relação ao mês anterior.
                                                        </p>
                                                    </div>
                                                )}

                                                {analiseData.queda.length > 0 && (
                                                    <div className="insight-item">
                                                        <span className="insight-icon">⚠️</span>
                                                        <p>
                                                            Atenção: <strong>{analiseData.queda[0].produto}</strong> teve uma queda de{' '}
                                                            <strong className="text-danger">{analiseData.queda[0].delta} peças</strong> vs mês anterior.
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="insight-item">
                                                    <span className="insight-icon">📊</span>
                                                    <p>
                                                        Neste mês, <strong>{analiseData.produtosVendidos} produtos</strong> tiveram vendas,
                                                        com média de <strong>{analiseData.mediaVendas} peças</strong> por produto.
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    </>
                                ) : (
                                    <Card>
                                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)' }}>
                                            👆 Selecione um mês acima para ver a análise inteligente completa
                                        </p>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {!clienteSelecionado && (
                <Card>
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        👈 Selecione um cliente para começar
                    </p>
                </Card>
            )}
        </div>
    )
}
