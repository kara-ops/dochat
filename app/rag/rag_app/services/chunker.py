import nltk
nltk.download("punkt_tab", quiet=True)
from nltk.tokenize import sent_tokenize


def chunk_text(text:str)->list[str]:
    text_into_sent = sent_tokenize(text)#whole block of text into array of sentences
    words_in_chunk = 0
    overlap_pos = 0
    var_while = True
    start_ind = 0
    sent = 0
    chunk = []

    while sent<=len(text_into_sent)-1:
        words_in_chunk += len(text_into_sent[sent].split())
        while var_while and words_in_chunk >= 250:
            overlap_pos = sent
            var_while = False
        
        if words_in_chunk >= 300:
            joined_sent = " ".join(text_into_sent[start_ind:sent+1])
            chunk.append(joined_sent)
            words_in_chunk = 0
            new_start = overlap_pos if overlap_pos > start_ind else sent
            sent = new_start
            start_ind = new_start
            overlap_pos = new_start
            var_while = True
        elif sent == len(text_into_sent)-1:
            joined_sent = " ".join(text_into_sent[start_ind:sent+1])
            chunk.append(joined_sent)
        sent += 1

    return chunk
            


