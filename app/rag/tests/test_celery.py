from app.services.chunker import chunk_text

text = open("temp/test.pdf", "rb")  # use a plain .txt file instead
# or just hardcode a long string
text = "Your test paragraph here. " * 50  # repeat to get 300+ words

chunks = chunk_text(text)
print(f"Chunks: {len(chunks)}")
for i, c in enumerate(chunks):
    print(f"Chunk {i+1}: {len(c.split())} words")