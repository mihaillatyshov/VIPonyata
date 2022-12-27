from pprint import pprint

import gtts
from playsound import playsound

# print(gtts.lang)
pprint(gtts.lang.tts_langs())
tts = gtts.gTTS("わたしは家族が好きです", lang="ja", tld="com.jo")
print("End of req")
# tts.write_to_fpsave("hola.mp3")
with open('hola.mp3', 'wb') as f:
    tts.write_to_fp(f)
playsound("hola.mp3")
