use calamine::{Reader, Sheets, open_workbook_auto_from_rs, DataType};
use std::io::Cursor;
use crate::{error::EngineError, models::raw::RawTable};

pub fn parse_excel(data: &[u8]) -> Result<RawTable, EngineError> {
    if data.is_empty() {
        return Err(EngineError::EmptyInput);
    }

    let reader = Cursor::new(data);
    
    // open_workbook_auto_from_rs detecta si es XLS, XLSX, XLSB o ODS
    let mut workbook: Sheets<_> = open_workbook_auto_from_rs(reader)
        .map_err(|e| {
            eprintln!("Error de Calamine: {:?}", e); // Para debugging
            EngineError::ExcelError
        })?;

    // Obtener la primera hoja disponible
    let sheet_name = workbook.sheet_names()
        .get(0)
        .ok_or(EngineError::EmptyInput)?
        .clone();
    
    let range = workbook.worksheet_range(&sheet_name)
        .map_err(|_| EngineError::ExcelError)?;

    let mut table = RawTable {
        headers: Vec::new(),
        rows: Vec::new(),
    };

    let mut header_row_index: Option<usize> = None;

    // 1. Localizar encabezados (Buscamos "CARNET" en la segunda columna)
    for (i, row) in range.rows().enumerate() {
        if row.get(1).map(|c| c.to_string().to_uppercase()) == Some("CARNET".to_string()) {
            header_row_index = Some(i);
            table.headers = row.iter()
                .map(|cell| cell.to_string().trim().to_string())
                .filter(|h| !h.is_empty())
                .collect();
            break;
        }
    }

    let start_index = header_row_index.ok_or(EngineError::ExcelError)? + 1;

    // 2. Procesar filas de datos
    for row in range.rows().skip(start_index) {
        // Si el número de carnet (#) está vacío, terminamos la tabla
        if row.get(0).map_or(true, |c| c.is_empty()) {
            break; 
        }

        let row_data: Vec<Option<String>> = row.iter()
            .map(|cell| {
                let s = cell.to_string().trim().to_string();
                if s.is_empty() { None } else { Some(s) }
            })
            .collect();
            
        table.rows.push(row_data);
    }

    Ok(table)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    #[test]
    fn test_parse_excel() {
        let data = fs::read("./data/Notas.xls").expect("Failed to read test Excel file");
        let table = parse_excel(&data).expect("Failed to parse Excel data");    

        println!("Headers: {:?}", table.headers);
        for row in table.rows.iter().take(5) {
            println!("Row: {:?}", row);
        }
        assert!(!table.headers.is_empty());
        assert!(!table.rows.is_empty());
    }
}