# Inkdesk repository protection plan

Goal: only Kevin (`code-kev`) controls changes to the repository, and every change to the published profile passes through a pull request, including Kevin's own changes.

Status: **active and verified on 2026-10-03**. GitHub's live rulesets match the committed configurations.

## Activation record

- [Owner-controlled branches](https://github.com/code-kev/code-kev/rules/24420015) is active for all branches.
- [Protect published profile](https://github.com/code-kev/code-kev/rules/24420052) is active for the default branch, with no bypass actors.
- [Setup PR #1](https://github.com/code-kev/code-kev/pull/1) passed `artwork-check` and was squash merged. The [first check on `main`](https://github.com/code-kev/code-kev/actions/runs/37130975944) also passed before activation.
- API readback confirmed the effective rules on `main`, the app-bound required check, squash-only merging, automatic deletion of merged feature branches, and read-only Actions permissions.
- Fork workflow approval now requires owner approval for **all external contributors**.
- On a disposable branch, owner creation and ordinary updates succeeded. With a temporary copy of the default-branch protections applied, direct pushes, force pushes, and branch deletion were each rejected by GitHub with `GH013` rule violations. The branch stayed unchanged after these attempts.
- The disposable branch and temporary ruleset were removed. No force push or deletion was attempted on `main`.

## Initial audit

Verified before activation on 2026-10-03:

- This is a public, personally owned repository with `main` as the default branch.
- `code-kev` is the sole account with repository access. There are no pending collaborator invitations or deploy keys.
- No rulesets or branch protection are configured, and there is no CI workflow.
- Squash merging is available and auto-merge is disabled.
- Actions defaults to a read-only token and cannot approve pull requests. Fork workflow approval currently covers first-time contributors.

## Protection policy

### 1. Inkdesk — owner-controlled branches

Target all branches (`~ALL`). Restrict branch creation, updates, and deletion. Only the repository administrator role can bypass this ruleset, using `always` mode. On this personally owned repository, that role is the owner, Kevin. Do not add collaborator roles, apps, teams, or deploy keys to the bypass list.

This rule keeps future collaborators and automation from changing repository branches or merging PRs. Public visitors can still fork the repository and propose changes, but cannot alter its branches.

Configuration: [owner-controlled-branches.json](rulesets/owner-controlled-branches.json).

### 2. Inkdesk — protect published profile

Target the default branch (`~DEFAULT_BRANCH`, currently `main`). No bypass actors, including the owner. Require:

- A pull request for every change.
- A successful `artwork-check` from the GitHub Actions app (verified app ID `15368`).
- Testing against the latest default branch before merging.
- Resolution of all review conversations.
- Squash merges and linear history.
- No force pushes or branch deletion.

Set required approving reviews to **zero**. Kevin is the sole maintainer, and requiring a second person's approval would block his own updates. Required code-owner review and approval of the last push remain disabled. The first ruleset still prevents anyone else from merging; zero required approvals does not grant merge access.

Configuration: [protect-published-profile.json](rulesets/protect-published-profile.json).

The two rulesets compose: bypassing the owner-control rule does not bypass the independent protections on `main`.

## CI and repository settings

The [verification workflow](../.github/workflows/artwork.yml) has a stable job/check name: `artwork-check`. It runs on every PR targeting `main` and on pushes to `main`, without path filters. It uses pinned action revisions, Node.js 24, and FFmpeg/FFprobe. It runs `npm ci` and `npm run check`. The check validates the README's referenced files and their published image metadata before rebuilding and verifying animation. Byte-identical regenerated GIFs across operating systems are not required; the pixel and animation checks validate the meaningful invariants.

Workflow permissions stay `contents: read`. Use the ordinary `pull_request` event, with no secrets or write token. Do not enable `pull_request_target` or automatic merges. Require owner approval before running workflows from **all external fork contributors**, rather than only first-time contributors.

Keep Kevin as the sole account with write access. Adding a collaborator, app, or writable deploy key is a separate permission decision and should trigger another access review.

Configure squash as the only merge method and enable automatic deletion of merged feature branches. Keep auto-merge disabled. CODEOWNERS and mandatory signed commits are not needed for this owner-controlled, single-maintainer workflow.

## Activation order

1. Create a feature branch containing the CI workflow, these configurations, and maintenance instructions. Open a PR and confirm `artwork-check` passes.
2. Merge that setup PR using squash, and confirm the check also passes on `main`.
3. Apply the merge-method and fork-workflow approval settings.
4. Create both rulesets with active enforcement. The JSON files describe the final active state; do not import the required-check ruleset before the check exists and has succeeded.
5. Read the rulesets and effective rules for `main` back from GitHub. Confirm the expected targets, bypass lists, app-bound required check, PR requirement, and history protections.
6. Verify on a disposable branch that a normal owner update works and that a valid PR can merge. For negative checks, use a disposable branch with a temporary copy of the default-branch protections and confirm direct pushes and force pushes are rejected; do not attempt a force push or deletion of the live profile branch. Remove the temporary test ruleset and branch after verification.

After activation, use `feature branch → PR → artwork-check → owner squash merge` for every profile change. Changing an artwork file on `main` directly will be rejected, even for Kevin.

The owner retains the ability to edit repository settings and rulesets. These policies govern repository changes; they do not remove that administrative authority.

## References

- [Personal repository permissions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository).
- [Available rules and how they compose](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).
- [Ruleset creation and bypass permissions](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository).
- [Rulesets REST API schema](https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset).
