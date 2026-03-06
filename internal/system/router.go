package system

import "github.com/gin-gonic/gin"

func Register(rg *gin.RouterGroup, handler *Handler) {
	rg.GET("/status", handler.Status)
	rg.GET("/detect", handler.Detect)
	rg.GET("/info", handler.Info)
	rg.GET("/disk-usage", handler.DiskUsage)
	rg.GET("/events", handler.Events)
	rg.POST("/prune", handler.Prune)
}
