
/**
 * Serviço para integrar com Google Sheets via Apps Script Web App
 */

export const fetchSheetData = async (url: string, tab: string) => {
  if (!url || !url.includes('script.google.com')) {
    console.warn("[Sheets] URL de planilha inválida ou ausente.");
    return null;
  }
  
  try {
    const baseUrl = url.trim().split('?')[0];
    const finalUrl = `${baseUrl}?tab=${encodeURIComponent(tab)}&t=${Date.now()}`;
    
    console.debug(`[Sheets] Tentando buscar aba "${tab}" em: ${finalUrl}`);
    
    const response = await fetch(finalUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
        console.error(`[Sheets] Erro HTTP ${response.status} na aba ${tab}`);
        return null;
    }
    
    const data = await response.json();
    console.debug(`[Sheets] Sucesso ao carregar aba "${tab}":`, data);
    return data;
  } catch (error) {
    console.error(`[Sheets] Erro crítico de rede (Failed to fetch). Verifique se a implantação do Google Script está como 'Anyone' e se a URL está correta.`, error);
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
      data: JSON.parse(JSON.stringify(data)) 
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      mode: 'cors', 
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        console.error(`[Sheets] Erro ao gravar dados: ${response.status}`);
        return false;
    }
    
    const result = await response.json();
    return result.success !== false;
  } catch (error) {
    console.error(`[Sheets] Erro no POST aba ${tab}:`, error);
    return false;
  }
};
