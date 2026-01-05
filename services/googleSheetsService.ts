
/**
 * Serviço para integrar com Google Sheets via Apps Script Web App
 */

export const fetchSheetData = async (url: string, tab: string) => {
  if (!url || !url.includes('script.google.com')) {
    return null;
  }
  
  try {
    const baseUrl = url.trim().split('?')[0];
    const finalUrl = `${baseUrl}?tab=${encodeURIComponent(tab)}&t=${Date.now()}`;
    
    const response = await fetch(finalUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow'
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`[Sheets] Erro ao ler aba ${tab}:`, error);
    return null;
  }
};

export const saveToSheet = async (url: string, tab: string, data: any[], action: 'insert' | 'update' | 'delete' = 'insert') => {
  if (!url || !url.includes('script.google.com')) {
    return false;
  }

  const baseUrl = url.trim().split('?')[0];
  try {
    // Garantir que os dados são objetos puros e sem referências circulares
    const cleanData = JSON.parse(JSON.stringify(data));
    
    const payload = {
      action: action,
      tab: tab,
      data: cleanData 
    };

    // O Google Apps Script prefere receber POST como text/plain para evitar problemas de pre-flight CORS complexos
    const response = await fetch(baseUrl, {
      method: 'POST',
      mode: 'cors', 
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });
    
    return response.ok;
  } catch (error) {
    console.error(`[Sheets] Erro ao gravar na aba ${tab}:`, error);
    return false;
  }
};
