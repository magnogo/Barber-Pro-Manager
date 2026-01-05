
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
      data: data 
    };

    // Removido 'no-cors' pois ele impede o envio correto de headers de conteúdo e causa bugs no parsing do GAS
    // Usando redirect: 'follow' pois o Google Apps Script redireciona o POST para uma URL de resultado
    const response = await fetch(baseUrl, {
      method: 'POST',
      mode: 'cors', 
      redirect: 'follow',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });
    
    // O Google Apps Script retorna 200 mesmo em redirecionamentos seguidos com sucesso
    return response.ok;
  } catch (error) {
    console.error(`[Sheets] Erro ao gravar:`, error);
    // Em alguns casos de CORS com GAS, o fetch pode lançar erro mesmo tendo gravado.
    // Como o saveToSheet é crítico, tentamos garantir que o payload foi enviado.
    return false;
  }
};
