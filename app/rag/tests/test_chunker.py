from app.services.chunker import chunk_text
from app.services.embeddings import embed_text

text = """ The internet, once a niche network connecting a handful of research institutions, has become the backbone of modern civilization. Its journey from the ARPANET of the late 1960s to today’s global digital ecosystem illustrates how technology can reshape economies, cultures, and human interaction. In its earliest phase, the internet was primarily a tool for academics and government researchers. Communication was text-based, slow, and limited to a small community. Yet even then, the seeds of transformation were planted: the idea that information could be shared instantly across vast distances.
By the 1990s, the World Wide Web introduced graphical interfaces, hyperlinks, and browsers that made the internet accessible to ordinary people. This democratization of information changed education, commerce, and entertainment. Suddenly, knowledge that was once locked in libraries or specialized institutions became available to anyone with a connection. Search engines like Yahoo and later Google organized this vast ocean of data, making it navigable and useful. The rise of e-commerce platforms such as Amazon and eBay demonstrated that the internet was not just about information—it was also about transactions, trust, and convenience.
The 2000s brought the era of social media. Platforms like Facebook, Twitter, and YouTube transformed the internet from a library into a public square. People were no longer passive consumers of information; they became creators, curators, and influencers. This shift empowered individuals to share their voices globally, but it also introduced challenges such as misinformation, echo chambers, and privacy concerns. The internet became both a tool of liberation and a source of anxiety, as digital footprints grew permanent and surveillance capabilities expanded.
Mobile technology accelerated this transformation. With smartphones, the internet was no longer confined to desktops or laptops—it became a constant companion. Apps streamlined communication, navigation, shopping, and entertainment. In countries like 
India, mobile internet access leapfrogged traditional infrastructure, connecting millions who had never owned a computer. This mobile revolution fueled new industries, from ride-hailing services to food delivery apps, and reshaped how people lived daily life.
Today, the internet is entering another phase: the age of artificial intelligence, cloud computing, and the Internet of Things (IoT). AI systems analyze massive datasets to provide personalized recommendations, automate tasks, and even generate creative content. Cloud platforms allow businesses to scale globally without owning physical servers. IoT devices—from smart thermostats to connected cars—extend the internet into the physical world, creating a seamless digital-physical hybrid environment. Yet these advances also raise questions about ethics, data ownership, and the balance between innovation and regulation.
The impact of the internet on society is profound. Economically, it has created trillion-dollar industries and disrupted traditional sectors. Culturally, it has blurred boundaries between nations, fostering global communities while also amplifying divisions. Socially, it has redefined relationships, identity, and even politics. The internet is no longer just a tool—it is an environment in which humanity now exists. As we move forward, the challenge will be to harness its power responsibly, ensuring that connectivity leads to empowerment rather than exploitation.
"""

chunks = chunk_text(text)

#print chunks
# for i, chunk in enumerate(chunks):
#     print(f"\n-- Chunk {i+1} ---")
#     print(f"Word count: {len(chunk.split())}")
#     print(chunk)

vectors = embed_text(chunks)

print(f"Number of chunks:{len(chunks)}")
print(f"Number of vectors: {len(vectors)}")
print(f"Vector size:{len(vectors[0])}")