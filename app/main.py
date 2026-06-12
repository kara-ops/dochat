from app.rag.app.routers.documents import  router as upload_route
from app.rag.app.routers.query import router as query_route
from app.rag.app.routers.auth_router import router as user_router
from app.o_auth.app.router.auth_routers import router as oauth_router
from app.workspace_service.routes import router as workspace_router
from fastapi import FastAPI,Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


app = FastAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request:Request,exec:Exception):
    return JSONResponse(
        status_code=500,
        content={"detail":"Internal server Error",
                 "type":str(type(exec))}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request:Request, exc:RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail":"Invalid request", "error":str(exc.errors())}
    )

app.include_router(upload_route)
app.include_router(query_route)
app.include_router(user_router)
app.include_router(oauth_router)
app.include_router(workspace_router)