# Verification and integration

`Profile verification` runs on pushes to `main` and `codex/**` review branches, pull requests targeting `main`, and manual workflow dispatches. Its job is named **`artwork-check`**, matching the check required by the active rules on `main`. Retain that job name when editing the workflow.

The job uses Ubuntu 24.04, Node.js 24, SHA-pinned checkout/setup actions and `npm ci` against the committed lockfile. It runs the verifier's tests and checks the published README assets. Its token has read-only repository contents permission, checkout does not retain credentials, and no step rewrites assets or pushes commits.

Dependabot checks npm dependencies and the pinned GitHub Actions monthly and proposes updates through pull requests. Review those updates with the same required checks. CI runs `npm audit --audit-level=high` and rejects high or critical dependency advisories independently of asset validation. Run `npm audit` when updating the verifier dependency.

The existing main-branch rules require an up-to-date `artwork-check`, a pull request with resolved review conversations, linear history and squash merging. No second-person approval is configured. An owner bypass is a separate repository permission; successful direct pushes do not demonstrate that the normal merge requirements have passed. This workflow update does not change those rules.

Before integration, check the run for the exact commit being merged. A successful release-branch push run verifies its files; the pull-request check verifies the proposed changes against the latest default branch. Run it again if the branch changes. Merely adding a workflow file is not evidence that its job succeeded.

See the [active main-branch rules](https://api.github.com/repos/code-kev/code-kev/rules/branches/main) and [workflow runs](https://github.com/code-kev/code-kev/actions/workflows/artwork.yml) for current status.
