use crate::{error::EngineError, models::raw::RawTable};

pub fn parse_csv(data: &[u8]) -> Result<RawTable, EngineError> {
    if data.is_empty() {
        return Err(EngineError::EmptyInput);
    }

    let mut table = RawTable {
        headers: Vec::new(),
        rows: Vec::new(),
    };

    let mut first_line = true;
    for line in data.split(|b| *b == b'\n') {
        if line.is_empty() {
            continue;
        }

        // Normalizar línea (eliminar posible \r)
        let line = if line.ends_with(&[b'\r']) {
            &line[..line.len() - 1]
        } else {
            line
        };

        if first_line {
            // Headers
            table.headers = line
                .split(|b| *b == b',')
                .map(|field| {
                    std::str::from_utf8(field)
                        .map_err(|_| EngineError::Utf8Error)
                        .map(|s| s.trim().to_string())
                })
                .collect::<Result<Vec<String>, EngineError>>()?;
            first_line = false;
        } else {
            // Fila de datos
            let row: Vec<Option<String>> = line
                .split(|b| *b == b',')
                .map(|field| {
                    let s = std::str::from_utf8(field)
                        .map_err(|_| EngineError::Utf8Error)?
                        .trim()
                        .to_string();

                    if s.is_empty() {
                        Ok(None)
                    } else {
                        Ok(Some(s))
                    }
                })
                .collect::<Result<Vec<Option<String>>, EngineError>>()?;
            table.rows.push(row);
        }
    }

    Ok(table)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_basic_csv_parsing() {
        let csv_data = b"Name,Age,Grade\nAlice,23,A\nBob,22,B\n";
        let result = parse_csv(csv_data);
        assert!(result.is_ok());
        let table = result.unwrap();
        assert_eq!(table.headers.len(), 3); // Name, Age, Grade
        assert_eq!(table.rows.len(), 2);    // Alice y Bob
    }

    #[test]
    fn test_invalid_utf8() {
        let csv_data = b"Name,Age\nAlice,\xFF\n";
        let result = parse_csv(csv_data);
        assert!(matches!(result, Err(EngineError::Utf8Error)));
    }

    #[test]
    fn test_empty_input() {
        let csv_data = b"";
        let result = parse_csv(csv_data);
        assert!(matches!(result, Err(EngineError::EmptyInput)));
    }
}
