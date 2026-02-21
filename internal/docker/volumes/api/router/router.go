package router

import (
	"github.com/gin-gonic/gin"
	api "github.com/rivernova/orcahub/internal/docker/volumes/api"
)

func Register(rg *gin.RouterGroup, handler *api.Handler) {
	volumes := rg.Group("/volumes")
	{
		volumes.GET("", handler.List)
		volumes.GET("/:name", handler.Inspect)
		volumes.POST("", handler.Create)
		volumes.DELETE("/:name", handler.Delete)
	}
}
