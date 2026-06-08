from app.services.ingestion import ingest_pdf

res = ingest_pdf(r"C:\Users\ankus\Downloads\test.pdf")
print(f"Documents saved:{res["id"]}")
print(f"filename:{res["filename"]}")

