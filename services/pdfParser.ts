
// This function relies on the pdf.js library being loaded globally from a CDN.
// The global object is `window.pdfjsLib`.

/**
 * Extracts text content from a PDF file.
 * @param file The PDF file object to parse.
 * @returns A promise that resolves with the extracted text as a single string.
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  if (typeof window === 'undefined' || !(window as any).pdfjsLib) {
    throw new Error('PDF.js library is not loaded.');
  }

  const pdfjsLib = (window as any).pdfjsLib;

  const arrayBuffer = await file.arrayBuffer();
  
  // Load the PDF document
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let fullText = '';

  // Iterate through each page and extract text
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n'; // Add newline between pages
  }

  return fullText.trim();
};
