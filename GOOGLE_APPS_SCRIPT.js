
/** 
 * BARBERPRO MASTER DRIVER V2.0 - BOLD EDITION
 * Suporte a Objetos JSON, Mapeamento de Cabeçalhos e Multi-Abas
 */

const EXPECTED_HEADERS = {
  'Empresas': ['id', 'name', 'address', 'phone', 'email', 'logo', 'isActive', 'googleSheetsUrl', 'plan', 'monthlyFee'],
  'ControlePagamentos': ['id', 'barbershopId', 'amount', 'date', 'status', 'method', 'referenceMonth'],
  'AdministradoresUnidades': ['id', 'barbershopId', 'name', 'email', 'role', 'status', 'urlfoto'],
  'Clientes': ['id', 'barbershopId', 'name', 'phone', 'email', 'photo'],
  'Servicos': ['id', 'barbershopId', 'name', 'durationMinutes', 'price'],
  'Funcionarios': ['id', 'barbershopId', 'name', 'nickname', 'email', 'position', 'role', 'useSchedule', 'startTime', 'endTime', 'workDays', 'photo'],
  'Agendamentos': ['id', 'barbershopId', 'barberId', 'clientId', 'serviceId', 'date', 'time', 'status']
};

function doGet(e) {
  try {
    const tabName = (e && e.parameter && e.parameter.tab) ? e.parameter.tab : 'Empresas';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
    
    // Inicializa cabeçalhos se a aba for nova
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(EXPECTED_HEADERS[tabName] || ['id']);
    }

    const data = sheet.getDataRange().getDisplayValues();
    if (data.length <= 1) return createResponse([]);

    const headers = data[0];
    const rows = data.slice(1);
    
    const json = rows.map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        if (header) obj[header] = row[i];
      });
      return obj;
    });
    
    return createResponse(json);
  } catch (err) {
    return createResponse({ error: err.toString() });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    const params = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tabName = params.tab || 'Empresas';
    let sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(EXPECTED_HEADERS[tabName] || ['id']);
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idColIndex = headers.indexOf('id');
    
    // Pegamos o primeiro item se os dados vierem em array
    const item = Array.isArray(params.data) ? params.data[0] : params.data;
    const idToFind = String(item.id).trim();

    // Mapeia o objeto para a ordem das colunas da planilha
    const rowValues = headers.map(header => {
      return item[header] !== undefined ? item[header] : "";
    });

    if (params.action === 'delete') {
      const allIds = sheet.getRange(1, idColIndex + 1, sheet.getLastRow(), 1).getValues();
      for (let i = allIds.length - 1; i >= 1; i--) {
        if (String(allIds[i][0]).trim() === idToFind) {
          sheet.deleteRow(i + 1);
        }
      }
      return createResponse({ status: "ok", action: "delete" });
    }

    if (params.action === 'update') {
      const allIds = sheet.getRange(1, idColIndex + 1, sheet.getLastRow(), 1).getValues();
      for (let i = 1; i < allIds.length; i++) {
        if (String(allIds[i][0]).trim() === idToFind) {
          sheet.getRange(i + 1, 1, 1, rowValues.length).setValues([rowValues]);
          return createResponse({ status: "ok", action: "update" });
        }
      }
    }
    
    // Default: Insert
    sheet.appendRow(rowValues);
    return createResponse({ status: "ok", action: "insert" });

  } catch (err) {
    return createResponse({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
