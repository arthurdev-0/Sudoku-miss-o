const { createApp } = Vue;

createApp({
    data() {
        return {
            puzzleInicial: [
                [5, 3, 0, 0, 7, 0, 0, 0, 0],
                [6, 0, 0, 1, 9, 5, 0, 0, 0],
                [0, 9, 8, 0, 0, 0, 0, 6, 0],
                [8, 0, 0, 0, 6, 0, 0, 0, 3],
                [4, 0, 0, 8, 0, 3, 0, 0, 1],
                [7, 0, 0, 0, 2, 0, 0, 0, 6],
                [0, 6, 0, 0, 0, 0, 2, 8, 0],
                [0, 0, 0, 4, 1, 9, 0, 0, 5],
                [0, 0, 0, 0, 8, 0, 0, 7, 9]
            ],
            gridMatrix: [], notasValores: {}, selectedRow: null, selectedCol: null,
            modoNotas: false, entidadeVenceu: false,
            mensagemStatus: "SISTEMA SEGURO. Aguardando input.", logs: []
        };
    },
    computed: {
        flatBoard() {
            let out = [];
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    out.push({
                        row: r, col: c,
                        value: this.gridMatrix[r] ? this.gridMatrix[r][c] : 0,
                        isFixed: this.puzzleInicial[r][c] !== 0
                    });
                }
            }
            return out;
        }
    },
    created() {
        this.reiniciarAmbiente();
        window.addEventListener('keydown', this.lidarTecladoFisico);
    },
    unmounted() {
        window.removeEventListener('keydown', this.lidarTecladoFisico);
    },
    methods: {
        obterHora() { return new Date().toTimeString().split(' ')[0]; },
        adicionarLog(text, type = 'system') { this.logs.unshift({ time: this.obterHora(), text, type }); },
        reiniciarAmbiente() {
            this.gridMatrix = JSON.parse(JSON.stringify(this.puzzleInicial));
            this.notasValores = {}; this.selectedRow = null; this.selectedCol = null;
            this.modoNotas = false; this.entidadeVenceu = false;
            this.mensagemStatus = "SISTEMA OPERACIONAL. Aguardando input.";
            this.logs = [];
            this.adicionarLog("Protocolo 'Human-in-the-Loop' ativado.", 'info');
        },
        selecionarCelula(r, c) {
            this.selectedRow = r; this.selectedCol = c;
            if (this.puzzleInicial[r][c] !== 0) this.adicionarLog(`Célula imutável.`);
            else this.adicionarLog(`Foco em (${r+1}, ${c+1}).`);
        },
        alternarModoNotas() {
            this.modoNotas = !this.modoNotas;
            this.adicionarLog(this.modoNotas ? "Modo notas ativado." : "Retornando à inserção direta.");
        },
        getNotasArray(r, c) { return this.notasValores[`${r}-${c}`] || []; },
        idxTemNota(r, c, n) { return this.getNotasArray(r, c).includes(n); },
        inserirEntrada(num) {
            if (this.entidadeVenceu || this.selectedRow === null || this.selectedCol === null) return;
            const r = this.selectedRow; const c = this.selectedCol;
            if (this.puzzleInicial[r][c] !== 0) return;

            if (this.modoNotas) {
                const key = `${r}-${c}`;
                if (!this.notasValores[key]) this.notasValores[key] = [];
                if (this.notasValores[key].includes(num)) {
                    this.notasValores[key] = this.notasValores[key].filter(x => x !== num);
                } else {
                    this.notasValores[key].push(num);
                }
            } else {
                if (this.validarRegrasSudoku(r, c, num)) {
                    this.gridMatrix[r][c] = num;
                    delete this.notasValores[`${r}-${c}`];
                    this.mensagemStatus = `Movimento executado em (${r+1}, ${c+1}).`;
                    this.adicionarLog(`Sucesso: ${num} em (${r+1}, ${c+1}).`);
                } else {
                    this.entidadeVenceu = true;
                    this.mensagemStatus = `FALHA. A Entidade previu o erro.`;
                    this.adicionarLog(`ERRO: Conflito com valor ${num}. Xeque-mate.`, 'error');
                }
            }
        },
        limparCelula() {
            if (this.entidadeVenceu || this.selectedRow === null || this.selectedCol === null) return;
            const r = this.selectedRow; const c = this.selectedCol;
            if (this.puzzleInicial[r][c] !== 0) return;
            this.gridMatrix[r][c] = 0; delete this.notasValores[`${r}-${c}`];
        },
        validarRegrasSudoku(linha, coluna, numero) {
            for (let i = 0; i < 9; i++) {
                if (i !== coluna && this.gridMatrix[linha][i] === numero) return false;
                if (i !== linha && this.gridMatrix[i][coluna] === numero) return false;
            }
            const initR = Math.floor(linha / 3) * 3; const initC = Math.floor(coluna / 3) * 3;
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    if ((initR+r !== linha || initC+c !== coluna) && this.gridMatrix[initR+r][initC+c] === numero) return false;
                }
            }
            return true;
        },
        lidarTecladoFisico(e) {
            if (this.entidadeVenceu) return;
            if (e.key >= '1' && e.key <= '9') this.inserirEntrada(parseInt(e.key));
            else if (e.key === 'Backspace' || e.key === 'Delete') this.limparCelula();
            else if (e.key.toLowerCase() === 'n') this.alternarModoNotas();
        }
    }
}).mount('#app');