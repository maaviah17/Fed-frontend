backend readme : 
"""
FedShield Backend — main.py
────────────────────────────────────────────────────────────────
How this works:
  1. Your deploy.ipynb runs on Google Colab as usual
  2. At the end of each FL round, Colab POSTs the results here
  3. React frontend polls this server to get live updates
  4. This server also receives log content from Colab and stores it

Endpoints:
  POST /start          ← Colab calls this when a round begins
  POST /update-logs    ← Colab calls this with log file contents
  POST /finish         ← Colab calls this when round is done (with result)
  GET  /results        ← React polls this
  GET  /logs           ← React polls this for live log content
  GET  /health         ← quick check the server is alive
"""