
from fastapi import FastAPI
from . import models
from .database import engine
from.routers import post, users, auth, vote
from .config import settings
from fastapi.middleware.cors import CORSMiddleware

print(settings.database_username)

#models.Base.metadata.create_all(bind=engine) 

#fetch('http://localhost:8000/').then(res => res.json()).then(console.log)

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(post.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(vote.router)

@app.get("/")
def read_root():
    return {"message": "Hello World!!! pushing out to ubuntu"}



