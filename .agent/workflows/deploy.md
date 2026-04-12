---
description: Push code to GitHub to trigger Railway deployment
---

When the user asks you to push the code, deploy, or update Github and Railway, you MUST execute this workflow:

1. Stage all changes by running:
    ```bash
    git add .
    ```

2. Commit the changes with a concise message describing the updates (e.g. `git commit -m "Your descriptive message"`).
    ```bash
    git commit -m "Auto-deploy: Updated game systems and logic"
    ```

3. Push the changes to the main branch on GitHub by running:
    ```bash
    git push origin main
    ```

4. Inform the user that since the Railway project is securely linked to the GitHub repository, pushing to the `main` branch will automatically trigger a new deployment on Railway.

*(Note: The global `railway` CLI is not necessary for continuous deployment; `git push` is the primary and correct trigger here.)*
