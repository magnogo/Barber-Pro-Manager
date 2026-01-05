
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
    const payload = {
      action: action,
      tab: tab,
      data: data // Aqui enviamos o array de objetos que o novo script Apps Script sabe processar
    };

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
