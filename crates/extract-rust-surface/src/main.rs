use std::collections::BTreeSet;
use std::env;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

#[derive(Debug, Default)]
struct Surface {
    instructions: BTreeSet<String>,
    accounts: BTreeSet<String>,
    errors: BTreeSet<String>,
}

fn read_generated_file(generated_dir: &Path, name: &str) -> io::Result<String> {
    fs::read_to_string(generated_dir.join(name))
}

fn strip_line_comment(line: &str) -> &str {
    line.split_once("//").map_or(line, |(before, _)| before)
}

/// `AcceptInvite` / `TopUpCollateral` → `acceptInvite` / `topUpCollateral` (Codama TS export names).
fn pascal_instruction_variant_to_ts_name(name: &str) -> String {
    let mut it = name.chars();
    let Some(first) = it.next() else {
        return String::new();
    };
    format!("{}{}", first.to_lowercase(), it.collect::<String>())
}

fn extract_instruction_names(source: &str) -> BTreeSet<String> {
    extract_plain_enum_variants(source, "SusuInstructionKind")
        .into_iter()
        .map(|v| pascal_instruction_variant_to_ts_name(&v))
        .collect()
}

fn extract_accounts(source: &str) -> BTreeSet<String> {
    source
        .lines()
        .filter_map(|line| {
            let line = strip_line_comment(line).trim();
            let rest = line.strip_prefix("pub struct ")?;
            let name = rest
                .split(|ch: char| !(ch.is_ascii_alphanumeric() || ch == '_'))
                .next()?;
            Some(name.to_owned())
        })
        .collect()
}

fn extract_plain_enum_variants(source: &str, enum_name: &str) -> BTreeSet<String> {
    let enum_start = format!("pub enum {enum_name}");
    let mut in_enum = false;
    let mut variants = BTreeSet::new();

    for line in source.lines() {
        let trimmed = strip_line_comment(line).trim();

        if !in_enum {
            if trimmed.starts_with(&enum_start) {
                in_enum = true;
            }
            continue;
        }

        if trimmed.starts_with('}') {
            break;
        }

        if trimmed.is_empty() || trimmed.starts_with("#[") {
            continue;
        }

        let variant = trimmed
            .trim_end_matches(',')
            .split(|ch: char| !(ch.is_ascii_alphanumeric() || ch == '_'))
            .next()
            .unwrap_or_default();

        if !variant.is_empty() {
            variants.insert(variant.to_owned());
        }
    }

    variants
}

fn json_array(values: &BTreeSet<String>) -> String {
    let items = values
        .iter()
        .map(|value| format!("    \"{}\"", json_escape(value)))
        .collect::<Vec<_>>()
        .join(",\n");
    format!("[\n{items}\n  ]")
}

fn json_escape(value: &str) -> String {
    value.replace('\\', "\\\\").replace('"', "\\\"")
}

fn surface_json(surface: &Surface) -> String {
    format!(
        "{{\n  \"instructions\": {},\n  \"accounts\": {},\n  \"errors\": {}\n}}\n",
        json_array(&surface.instructions),
        json_array(&surface.accounts),
        json_array(&surface.errors),
    )
}

fn extract(generated_dir: &Path) -> io::Result<Surface> {
    let instructions = read_generated_file(generated_dir, "instructions.rs")?;
    let accounts = read_generated_file(generated_dir, "accounts.rs")?;
    let errors = read_generated_file(generated_dir, "errors.rs")?;

    Ok(Surface {
        instructions: extract_instruction_names(&instructions),
        accounts: extract_accounts(&accounts),
        errors: extract_plain_enum_variants(&errors, "SusuError"),
    })
}

fn main() -> io::Result<()> {
    let generated_dir = env::args_os()
        .nth(1)
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("sdk/rust/src/generated"));

    let surface = extract(&generated_dir)?;
    print!("{}", surface_json(&surface));
    Ok(())
}
