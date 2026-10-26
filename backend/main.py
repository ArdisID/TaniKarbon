from fastapi import FastAPI

app = FastAPI(title="TaniKarbon API")

@app.get("/")
def read_root():
    return {"status": "Server TaniKarbon nyala dan siap tempur!"}