
/**
 * Serviço para integrar com Google Sheets via Apps Script Web App
 * Otimizado para evitar erros de CORS e 'Failed to fetch'
 */

export const fetchSheetData = async (url: string, tab: string) => {
  if (!url || !url.includes('script.google.com')) {
    console.warn(`[Sheets] URL Inválida: ${url}`);
    return null;
  }
  
  try {
    const baseUrl = url.trim().split('?')[0];
    const finalUrl = `${baseUrl}?tab=${encodeURIComponent(tab)}&t=${Date.now()}`;
    
    console.log(`[Sheets] GET -> ${tab}`);
    
    // IMPORTANTE: Para evitar pre-flight OPTIONS (CORS), não enviamos nenhum Header customizado
    // e usamos redirect: 'follow' que é obrigatório para scripts do Google.
    const response = await fetch(finalUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow'
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[Sheets] Falha na aba ${tab}:`, error);
    return null;
  }
};

export const saveToSheet = async (url: string, tab: string, data: any[], action: 'insert' | 'update' | 'delete' = 'insert') => {
  if (!url || !url.includes('script.google.com')) {
    console.warn("[Sheets] URL de gravação inválida");
    return false;
  }

  const baseUrl = url.trim().split('?')[0];
  console.log(`[Sheets] POST -> ${tab} | Ação: ${action}`);

  try {
    const payload = {
      action: action,
      tab: tab,
      data: data
    };

    // Google Apps Script POST só funciona sem erro de CORS usando 'no-cors' ou Content-Type text/plain
    await fetch(baseUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });
    
    return true;
  } catch (error) {
    console.error(`[Sheets] Erro ao gravar:`, error);
    return false;
  }
};
