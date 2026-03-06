package router

import (
	"github.com/gin-gonic/gin"
	"github.com/rivernova/orcahub/internal/docker/images/api"
)

func Register(rg *gin.RouterGroup, handler *api.Handler) {
	images := rg.Group("/images")
	{
		images.GET("", handler.List)
		images.GET("/:id", handler.Inspect)
		images.GET("/:id/history", handler.History)
		images.DELETE("/:id", handler.Delete)
		images.POST("/pull", handler.Pull)
		images.POST("/build", handler.Build)
		images.POST("/tag", handler.Tag)
		images.POST("/prune", handler.Prune)
	}
}
