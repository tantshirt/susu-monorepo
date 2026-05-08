use std::process::Command;

fn main() {
    let commit = std::env::var("GIT_COMMIT_SHA")
        .ok()
        .filter(|value| !value.trim().is_empty())
        .or_else(git_head)
        .unwrap_or_else(|| "unknown".to_string());

    println!("cargo:rustc-env=SUSU_ADVERSARY_BUILD_COMMIT={commit}");
}

fn git_head() -> Option<String> {
    let output = Command::new("git")
        .args(["rev-parse", "HEAD"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let commit = String::from_utf8(output.stdout).ok()?;
    let trimmed = commit.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}
