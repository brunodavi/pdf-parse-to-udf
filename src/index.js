// Importa as funções necessárias da versão ESM do pdf.js
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs';

// Desabilita os Web Workers para rodar tudo na thread principal
// Essencial para o seu bundle único em V8 puro
GlobalWorkerOptions.workerSrc = undefined;

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
export async function extractPdfText(pdfDataAsUint8Array) {
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
}