import { useState, useEffect } from 'react'
import { db } from '../../services/supabase'
import { salesService } from '../../services/sales'
import { parseCSV, readFileAsText } from '../../utils/csvParser'
import Button from '../common/Button'
import Card from '../common/Card'
import Input from '../common/Input'
import './SalesAnalysis.css'

export default function SalesAnalysis({ userId }) {
    const [clientes, setClientes] = useState([])
    const [clienteSelecionado, setClienteSelecionado] = useState(null)
    const [anos, setAnos] = useState([])
    const [anoSelecionado, setAnoSelecionado] = useState(null)
    const [vendas, setVendas] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState('import')
    const [uploadProgress, setUploadProgress] = useState(null)
    const [matrizData, setMatrizData] = useState(null)
    const [filtro, setFiltro] = useState('')
    const [favoritos, setFavoritos] = useState([])
    const [mesSelecionadoAnalise, setMesSelecionadoAnalise] = useState(null)
    const [analiseData, setAnaliseData] = useState(null)

    // Load clients on mount
    useEffect(() => {
        loadClientes()
    }, [])

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
                    ...d
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

    const produtosFavoritos = matrizData?.produtos.filter(p => favoritos.includes(p.produto))



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
                                                                    {f.error && <span style={{display: 'block', fontSize: '0.8em'}}>{f.error}</span>}
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
                                <div className="matriz-controls">
                                    <Input
                                        placeholder="Filtrar produto..."
                                        value={filtro}
                                        onChange={(e) => setFiltro(e.target.value)}
                                        icon={<span>🔍</span>}
                                    />
                                </div>
                                {loading ? (
                                    <div className="loading-container"><div className="loading-spinner"></div></div>
                                ) : matrizData && produtosFiltrados ? (
                                    <div className="matriz-container">
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
                                ) : (
                                    <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        Nenhum dado de vendas. Importe os arquivos CSV primeiro.
                                    </p></Card>
                                )}
                            </div>
                        )}

                        {/* Favoritos Tab */}
                        {activeTab === 'favoritos' && (
                            <div>
                                <div className="favoritos-actions">
                                    <div className="input-wrapper">
                                        <label className="input-label">Marcar produto como essencial</label>
                                        <select
                                            className="input"
                                            style={{ padding: 'var(--space-4)' }}
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleToggleFavorito(e.target.value)
                                                    e.target.value = ''
                                                }
                                            }}
                                        >
                                            <option value="">Selecione um produto...</option>
                                            {matrizData?.produtos.map((p, idx) => (
                                                <option key={idx} value={p.produto}>
                                                    {favoritos.includes(p.produto) ? '⭐ ' : ''}{p.produto}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {produtosFavoritos && produtosFavoritos.length > 0 ? (
                                    <div className="matriz-container">
                                        <table className="matriz-table">
                                            <thead>
                                                <tr>
                                                    <th className="produto-col">Produto Essencial</th>
                                                    {matrizData.meses.map(mes => (
                                                        <th key={mes}>{mes}</th>
                                                    ))}
                                                    <th>Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {produtosFavoritos.map((produto, idx) => (
                                                    <tr key={idx}>
                                                        <td className="produto-col">⭐ {produto.produto}</td>
                                                        {matrizData.meses.map(mes => (
                                                            <td key={mes} className={getCellColor(produto.produto, mes, matrizData.meses)}>
                                                                {produto[mes] || 0}
                                                            </td>
                                                        ))}
                                                        <td>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleToggleFavorito(produto.produto)}
                                                            >
                                                                🗑️
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        Nenhum produto marcado como essencial
                                    </p></Card>
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
