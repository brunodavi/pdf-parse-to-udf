// Importa as funções necessárias da versão ESM do pdf.js
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs';

// Desabilita os Web Workers para rodar tudo na thread principal
// Essencial para o seu bundle único em V8 puro
GlobalWorkerOptions.workerSrc = undefined;


/**
 * Converte um Array de bytes (ex: [0, 255]) para um Uint8Array.
 * @param {Array<number>} arr O array de bytes.
 * @returns {Uint8Array}
 */
function byteArrayToUint8Array(arr) {
    // Esta é a forma mais rápida de converter um array de números
    // para o formato que pdf.js espera.
    return new Uint8Array(arr);
}

/**
 * Extrai texto de um PDF a partir de múltiplas fontes de dados binários.
 *
 * @param {ArrayBuffer | Uint8Array | Buffer | Array<number> | any} input
 * O PDF. Pode ser:
 * 1. Uint8Array (formato ideal)
 * 2. ArrayBuffer
 * 3. Buffer (tipo do V8/Node.js)
 * 4. Array<number> ou byte[] (ex: [0, 255, ...])
 *
 * @returns {Promise<string>} O texto extraído do PDF.
 */
export async function extractPdfText(input) {
    let pdfDataAsUint8Array;

    try {
        // 1. É Uint8Array? (Formato ideal, sem conversão)
        if (input instanceof Uint8Array) {
            pdfDataAsUint8Array = input;
        
        // 2. É um ArrayBuffer?
        } else if (input instanceof ArrayBuffer) {
            pdfDataAsUint8Array = new Uint8Array(input);

        // 3. É um Buffer? (Checagem segura)
        } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
            // Converte o Buffer (V8) para Uint8Array
            pdfDataAsUint8Array = new Uint8Array(input);

        // 4. É um Array ou byte[]?
        } else if (Array.isArray(input)) {
            // Assume que é um Array de números (byte[] ou [0, 255, ...])
            pdfDataAsUint8Array = byteArrayToUint8Array(input);
        
        // 5. É um Stream?
        } else if (input && typeof input.read === 'function') {
            // Não podemos processar streams diretamente.
            throw new Error('A entrada parece ser um Stream. Por favor, converta o Stream para um byte[], ArrayBuffer ou Buffer antes de chamar esta função.');
        
        // 6. Tipo desconhecido
        } else {
            throw new Error('Tipo de entrada não suportado. Use ArrayBuffer, Uint8Array, Buffer ou um Array de bytes (byte[]).');
        }

        // --- Processamento do PDF ---

        // Carrega o documento usando o Uint8Array
        const pdfDocument = await getDocument({ data: pdfDataAsUint8Array }).promise;
        let allText = "";

        // Itera por todas as paginas
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            
            // Junta todos os fragmentos de texto da página
            const pageText = textContent.items.map(item => item.str).join(" ");
            allText += pageText + "\n"; // Adiciona o texto da página e uma quebra de linha
        }
        
        return allText.trim();

    } catch (error) {
        // Usa console.log para registrar o erro
        console.log("Erro ao processar o PDF: " + (error.message || error));
        throw new Error(`Falha ao extrair texto do PDF: ${error.message}`);
    }
}