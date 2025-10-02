// PDF Parser Service
// This service handles PDF parsing for bank statements

class PDFParser {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Dynamic import of pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set up worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      this.pdfjsLib = pdfjsLib;
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize PDF parser:', error);
      throw new Error('PDF parsing is not available');
    }
  }

  async parsePDF(file) {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const pdf = await this.pdfjsLib.getDocument(arrayBuffer).promise;
          
          let fullText = '';
          
          // Extract text from all pages
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map(item => item.str)
              .join(' ');
            fullText += pageText + '\n';
          }
          
          resolve(fullText);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}

export default new PDFParser();
