package system

import "github.com/gin-gonic/gin"

func Register(rg *gin.RouterGroup, handler *Handler) {
	rg.GET("/status", handler.Status)
}
