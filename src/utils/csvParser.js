// CSV Parser utility for sales data

export function parseCSV(fileContent, filename) {
    const lines = fileContent.split('\n').filter(line => line.trim())
    if (lines.length === 0) return { data: [], mes: null }

    // Extract month from filename
    // Strategy: Look for specific patterns first, then fallback to simple numbers
    // 1. Look for "_01.", " 01.", "-01." etc (number at end or before extension)
    // 2. Look for "Mês 01" or "Mes 01"
    // 3. Look for isolated numbers 1-12
    
    let mesNum = 0
    
    // Pattern 1: Number before .csv or at end of string (e.g., "vendas_01.csv", "planilha 05")
    const endMatch = filename.match(/[\s_.-](\d+)\.?[^0-9]*$/)
    if (endMatch) {
         const num = parseInt(endMatch[1])
         if (num >= 1 && num <= 12) mesNum = num
    }

    // Pattern 2: Explicit "Mês X"
    if (mesNum === 0) {
        const mesMatch = filename.match(/m[eê]s\s*(\d+)/i)
        if (mesMatch) {
             const num = parseInt(mesMatch[1])
             if (num >= 1 && num <= 12) mesNum = num
        }
    }

    // Pattern 3: Look for month names (pt-BR)
    if (mesNum === 0) {
        const mesesRegex = [
            { regex: /janeiro|jan\.?|(^|[^a-z])jan($|[^a-z])/i, num: 1 },
            { regex: /fevereiro|fev\.?|(^|[^a-z])fev($|[^a-z])/i, num: 2 },
            { regex: /mar[cç]o|mar\.?|(^|[^a-z])mar($|[^a-z])/i, num: 3 },
            { regex: /abril|abr\.?|(^|[^a-z])abr($|[^a-z])/i, num: 4 },
            { regex: /maio|mai\.?|(^|[^a-z])mai($|[^a-z])/i, num: 5 },
            { regex: /junho|jun\.?|(^|[^a-z])jun($|[^a-z])/i, num: 6 },
            { regex: /julho|jul\.?|(^|[^a-z])jul($|[^a-z])/i, num: 7 },
            { regex: /agosto|ago\.?|ags\.?|(^|[^a-z])ago($|[^a-z])/i, num: 8 },
            { regex: /setembro|set\.?|sep\.?|(^|[^a-z])set($|[^a-z])/i, num: 9 },
            { regex: /outubro|out\.?|oct\.?|(^|[^a-z])out($|[^a-z])/i, num: 10 },
            { regex: /novembro|nov\.?|(^|[^a-z])nov($|[^a-z])/i, num: 11 },
            { regex: /dezembro|dez\.?|dec\.?|(^|[^a-z])dez($|[^a-z])/i, num: 12 }
        ]
        
        for (const m of mesesRegex) {
            if (m.regex.test(filename)) {
                mesNum = m.num
                break
            }
        }
    }

    // Pattern 4: Fallback - find FIRST number that is 1-12 (risky if year is first)
    // "2024 vendas 01.csv" -> 2024 (skip) -> 01 (ok)
    if (mesNum === 0) {
        const allNumbers = filename.match(/\d+/g)
        if (allNumbers) {
            for (const numStr of allNumbers) {
                const num = parseInt(numStr)
                if (num >= 1 && num <= 12) {
                    mesNum = num
                    break // Take the first valid month number
                }
            }
        }
    }
    
    const mesRef = mesNum > 0 ? `Mês ${mesNum.toString().padStart(2, '0')}` : 'Geral'

    // Parse CSV (semicolon separated, common in Brazilian CSVs)
    const rows = lines.map(line => {
        // Handle both comma and semicolon delimiters
        const delimiter = line.includes(';') ? ';' : ','
        return line.split(delimiter).map(cell => cell.trim())
    })

    const headers = rows[0].map(h => h.toLowerCase())

    // Find column indices
    // Prioritize specific 'code' columns, then generic 'produto'
    const indexCodigo = findColumnIndex(headers, ['código', 'codigo', 'cod', 'referencia', 'ref', 'item', 'produto'])

    // Prioritize specific 'description' columns
    const indexDescricao = findColumnIndex(headers, ['descrição', 'descricao', 'descri', 'nome'])

    const indexQtd = findColumnIndex(headers, ['qtd', 'quant', 'quantidade'])
    const indexValor = findColumnIndex(headers, [
        'total venda', 'valor total', 'total', 'valor', 'vl'
    ])

    // We need at least one identification column and quantity
    if ((indexCodigo === -1 && indexDescricao === -1) || indexQtd === -1) {
        throw new Error('Não foi possível identificar as colunas de produto/código e quantidade')
    }

    // Parse data rows
    const data = []
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i]

        // Skip if row doesn't have enough columns
        if (row.length <= indexQtd) continue

        // Determine code and name
        let codigo = null
        let nome = null

        if (indexCodigo !== -1) codigo = row[indexCodigo]?.trim()
        if (indexDescricao !== -1) nome = row[indexDescricao]?.trim()

        // Fallback strategies
        if (!codigo && nome) codigo = nome // Use name as code if no code
        if (!nome && codigo) nome = codigo // Use code as name if no name

        if (!codigo || codigo.toLowerCase() === 'nan') continue

        const quantidade = parseQuantity(row[indexQtd])
        if (quantidade <= 0) continue

        const valor = indexValor !== -1 ? parseValue(row[indexValor]) : 0

        data.push({
            produto: codigo, // This is the ID/Link
            produto_nome: nome, // This is the display name
            quantidade,
            valor,
            mes_ref: mesRef
        })
    }

    return { data, mes: mesRef }
}

function findColumnIndex(headers, keywords) {
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i]
        for (const keyword of keywords) {
            if (header.includes(keyword)) {
                return i
            }
        }
    }
    return -1
}

function parseQuantity(str) {
    if (!str) return 0
    try {
        const cleaned = str.replace(/[^\d.,]/g, '').replace(',', '.')
        return parseInt(parseFloat(cleaned))
    } catch {
        return 0
    }
}

function parseValue(str) {
    if (!str) return 0
    try {
        // Remove R$, spaces, etc
        let cleaned = str.replace(/[R$\s]/g, '')

        // Handle Brazilian format: 1.234,56 -> 1234.56
        if (cleaned.includes(',') && cleaned.includes('.')) {
            // Has both: remove thousands separator (.), keep decimal (,)
            cleaned = cleaned.replace(/\./g, '').replace(',', '.')
        } else if (cleaned.includes(',')) {
            // Only comma: treat as decimal
            cleaned = cleaned.replace(',', '.')
        }

        return parseFloat(cleaned) || 0
    } catch {
        return 0
    }
}

export async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = (e) => reject(e)

        // Try to detect encoding (Brazilian CSVs often use latin1/ISO-8859-1)
        reader.readAsText(file, 'ISO-8859-1')
    })
}
