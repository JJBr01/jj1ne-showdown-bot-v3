# Running the bot 24/7 on Azure with Claude Opus 5 at the wheel

## 1. Your Claude deployment (Microsoft Foundry)
1. In the Foundry portal open your Claude deployment → **Details** tab.
2. Copy the **Target URI** (looks like `https://YOUR-RESOURCE.services.ai.azure.com/anthropic/v1/messages`) and the **Key**.
3. In `config.json` set:
   - `claude.endpoint` → `https://YOUR-RESOURCE.services.ai.azure.com/anthropic` (the bot adds `/v1/messages` itself; pasting the full Target URI also works)
   - `claude.deployment` → your deployment name exactly as shown in Foundry (e.g. `claude-opus-5`)
4. **Never put the key in config.json.** It goes in an environment variable `AZURE_CLAUDE_KEY` (step 3) — or Azure Key Vault if you prefer.

## 2. Create a small VM
Azure portal → Virtual machines → Create:
- Image: **Ubuntu Server 24.04 LTS**; size: **B2s** is plenty (the bot is light; Claude runs in Foundry)
- Authentication: SSH key; username `azureuser`
- Inbound ports: SSH only (the bot makes outbound connections only)
- Set a **budget alert** on the subscription (Cost Management → Budgets) covering VM + Claude usage.

## 3. Install and configure (SSH into the VM)
```bash
sudo apt update && sudo apt install -y git unzip curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
# copy the zip up (from your PC):  scp jj1ne-showdown-bot.zip azureuser@VM_IP:~
unzip jj1ne-showdown-bot.zip && cd jj1ne-showdown-bot
./setup.sh
echo 'AZURE_CLAUDE_KEY=paste-your-key-here' > .env && chmod 600 .env
nano config.json        # endpoint, deployment, games (0 = unlimited), coachEvery
```

## 4. Test once in the foreground
```bash
set -a; source .env; set +a; ./run.sh 3      # play 3 battles as a test
```
You should see `pilot=claude (claude-opus-5)`, `Logged in as JJ1NE`, then per game a line like
`Claude: 12/13 decisions, 3 overrides, 1 fallbacks`. Ctrl+C to stop.
(Close any browser tab that is using the name JJ1NE first.)

## 5. Run it as a service (survives logout and reboots)
```bash
sudo cp jj1ne-bot.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now jj1ne-bot
journalctl -u jj1ne-bot -f          # live log
sudo systemctl stop jj1ne-bot       # stop  (or: touch STOP — stops after the current game)
```

## 6. Getting results back
Everything is in the bot folder: `results.csv`, `bot.log`, `reports/`, `coach/`, `data/`.
`scp -r azureuser@VM_IP:~/jj1ne-showdown-bot/{results.csv,reports,coach,data} .` and send them to me.

## Cost control
- Every turn is one Claude call (~3–5k input tokens). Opus is the most capable and the most expensive per token.
- Keep `games` finite while testing; watch the budget alert.
- To cut cost: set `"pilot": "wolfe"` (no API calls), or point `claude.deployment` at a cheaper/faster model deployment for turns.
- The coach runs every `coachEvery` games (one larger call).

## If Claude is slow or down
Every decision has a hard timeout (`turnTimeoutMs`, default 25 s). Timeouts, errors and invalid answers automatically fall back to the built-in Wolfe engine pilot, so the Showdown turn timer is never at risk. Fallbacks are counted in the log and in each game report.
