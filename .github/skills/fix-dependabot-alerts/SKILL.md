---
name: fix-dependabot-alert
description: Investigate and fix GitHub Dependabot security alerts in repositories using the gh CLI. Supports private repositories. Use when asked to fix, remediate, or investigate Dependabot alerts, vulnerable dependencies, or Dependabot security PRs.
---

# Fix Dependabot Alert

Use this skill to safely investigate and remediate GitHub Dependabot security alerts.

## Preconditions

- `gh` CLI must be installed and authenticated.
- The repository may be private.
- Run commands from the repository working tree when possible.
- Never print, commit, or expose authentication tokens, secrets, `.env` files, credentials, or private keys.

## Core workflow

### 1. Identify the repository

Prefer the current git remote:

```bash
gh repo view --json nameWithOwner -q .nameWithOwner
```

If the current directory is not a GitHub repository, ask for `OWNER/REPO`.

Verify access:

```bash
gh repo view OWNER/REPO
```

Do not assume the repository is public.

### 2. Inspect Dependabot alerts

List open Dependabot alerts:

```bash
gh api --paginate \
  -H "Accept: application/vnd.github+json" \
  "/repos/OWNER/REPO/dependabot/alerts?state=open&per_page=100"
```

For a compact view:

```bash
gh api --paginate \
  "/repos/OWNER/REPO/dependabot/alerts?state=open&per_page=100" \
  --jq '.[] | [
    .number,
    .state,
    .dependency.package.ecosystem,
    .dependency.package.name,
    .security_vulnerability.severity,
    .security_vulnerability.vulnerable_version_range,
    .security_vulnerability.first_patched_version.identifier,
    .html_url
  ] | @tsv'
```

If the repository has a large number of alerts, focus first on alerts with available patched versions and higher severity, but do not describe this as a permanent priority policy unless the user specifies one.

### 3. Inspect the affected dependency locally

Determine the package manager from the alert and repository files.

Common files:

- npm: `package.json`, lockfiles
- pnpm: `package.json`, `pnpm-lock.yaml`
- Yarn: `package.json`, `yarn.lock`
- Python: `pyproject.toml`, `requirements*.txt`, lockfiles
- Ruby: `Gemfile`, `Gemfile.lock`
- Bundler: `Gemfile.lock`
- Maven: `pom.xml`
- Gradle: `build.gradle`, `build.gradle.kts`, lockfiles
- Go: `go.mod`, `go.sum`
- Rust: `Cargo.toml`, `Cargo.lock`
- NuGet: `*.csproj`, `packages.lock.json`, `*.props`

Check the dependency tree before changing versions.

Examples:

```bash
npm ls PACKAGE --all
pnpm why PACKAGE
yarn why PACKAGE
python -m pip show PACKAGE
go mod why PACKAGE
cargo tree -i PACKAGE
```

Use the package manager's native update mechanism where possible rather than manually editing lockfiles.

### 4. Understand the alert

For each alert, determine:

1. Direct or transitive dependency.
2. Current installed version.
3. Vulnerable version range.
4. First patched version, if GitHub provides one.
5. Whether the dependency can be upgraded without a major-version migration.
6. Whether multiple dependencies are coupled through the same lockfile.
7. Whether the alert is already addressed by the working tree or an existing PR.

Inspect existing Dependabot PRs:

```bash
gh pr list --repo OWNER/REPO --state open \
  --search "dependabot"
```

Also inspect branches when useful:

```bash
git branch -a
```

Do not create a duplicate PR if an appropriate Dependabot PR already exists.

### 5. Choose the smallest safe remediation

Prefer, in order:

1. Upgrade the affected direct dependency to the first compatible patched version.
2. Upgrade the transitive parent dependency that brings in the vulnerable package.
3. Use a compatible lockfile resolution update.
4. Make a broader dependency upgrade only when required to reach a patched version.

Avoid unrelated dependency upgrades.

Do not use `npm audit fix --force` or equivalent broad/force upgrades unless the user explicitly asks for them and the consequences are understood.

### 6. Make the change

Use the repository's package manager and existing project conventions.

Examples:

```bash
npm install PACKAGE@PATCHED_VERSION
npm update PACKAGE
pnpm update PACKAGE --latest
yarn up PACKAGE@PATCHED_VERSION
go get PACKAGE@VERSION
go mod tidy
cargo update -p PACKAGE
```

For Python, update the project's declared dependency and regenerate the lockfile using the project's normal tooling.

For Maven/Gradle/.NET/Ruby, use the project's established dependency management commands.

Do not hand-edit generated lockfiles unless there is no supported package-manager workflow.

### 7. Run validation

First inspect the diff:

```bash
git diff --check
git diff
```

Then run the repository's relevant checks. Prefer existing scripts:

```bash
npm test
npm run lint
npm run build
```

or their equivalents for the project.

At minimum, run the narrowest relevant test suite plus build/type-check/lint when those are standard project checks.

If tests fail:

- Determine whether the failure is caused by the dependency update.
- Fix only issues necessary for the dependency update.
- Do not hide unrelated pre-existing failures.
- Report pre-existing failures separately.

### 8. Re-check the vulnerability

Run the project's security/dependency audit when appropriate:

```bash
npm audit
pnpm audit
yarn npm audit
```

Also re-query GitHub Dependabot alerts after the fix when the repository state allows it:

```bash
gh api --paginate \
  "/repos/OWNER/REPO/dependabot/alerts?state=open&per_page=100"
```

A local audit passing does not necessarily prove that GitHub's alert has closed, and vice versa.

### 9. Commit and PR

Only commit or push if the user asked for the alert to be fixed in the repository and the working-tree changes are clearly limited to the remediation.

Before committing:

```bash
git status --short
git diff --check
```

Use a descriptive branch, for example:

```bash
git switch -c fix/dependabot-PACKAGE
```

Commit example:

```bash
git add relevant/files
git commit -m "fix: update PACKAGE for security vulnerability"
```

Push:

```bash
git push -u origin HEAD
```

Create a PR:

```bash
gh pr create \
  --repo OWNER/REPO \
  --title "fix: remediate Dependabot vulnerability in PACKAGE" \
  --body-file /tmp/dependabot-pr.md
```

The PR description should include:

- Dependabot alert number/URL if available.
- Vulnerable package and version.
- Patched version.
- Direct/transitive status.
- What changed.
- Tests/checks run.
- Any remaining limitations.

Do not claim the alert is resolved until the resulting state has been verified.

## Handling Dependabot security PRs

If GitHub already has a Dependabot security PR:

```bash
gh pr view PR_NUMBER --repo OWNER/REPO
gh pr diff PR_NUMBER --repo OWNER/REPO
gh pr checks PR_NUMBER --repo OWNER/REPO
```

If it is correct and checks pass, prefer merging the existing PR rather than creating a duplicate.

Only merge when the user explicitly authorized merging. Otherwise, prepare or update the PR and report that it is ready.

## Handling private repositories

`gh` works with private repositories when the authenticated account has sufficient permissions.

Useful checks:

```bash
gh auth status
gh repo view OWNER/REPO
```

Never switch to unauthenticated public GitHub URLs or suggest making the repository public just to inspect Dependabot data.

If GitHub returns `403`, `404`, or an authentication error:

- Check `gh auth status`.
- Confirm the repository name.
- Confirm the account has access to Dependabot alerts and repository contents.
- Do not infer that the private repository does not exist from a `404`.

## Important safety rules

- Do not expose secrets or authentication headers.
- Do not modify application behavior unrelated to the vulnerable dependency.
- Do not delete lockfiles as a shortcut.
- Do not suppress or dismiss a security alert merely to make it disappear.
- Do not mark an alert dismissed unless the user explicitly requests dismissal and provides/approves the reason.
- Do not merge a PR without explicit user authorization.
- Do not force-push unless explicitly requested.
- Preserve unrelated user changes in the working tree.
- If the working tree contains unrelated uncommitted changes, do not overwrite them. Make the smallest possible changes and clearly report them.
- If the remediation requires a major dependency upgrade with potentially breaking behavior, explain that before making broad changes.

## Output format

At the end, report:

```text
Dependabot remediation
- Repository: OWNER/REPO
- Alert: #NUMBER
- Package: PACKAGE
- Vulnerable version: VERSION/RANGE
- Patched version: VERSION
- Dependency type: direct/transitive
- Change made: ...
- Validation: ...
- GitHub alert status: open/resolved/not yet verified
- PR: URL (if created)
```

If multiple alerts were fixed, provide one concise entry per alert and identify any alerts that remain open.
