package router

import (
	"github.com/gin-gonic/gin"
	"github.com/rivernova/orcahub/internal/docker/containers/api"
)

func Register(rg *gin.RouterGroup, handler *api.Handler) {
	containers := rg.Group("/containers")
	{
		containers.GET("", handler.List)
		containers.GET("/:id", handler.Inspect)
		containers.POST("", handler.Create)
		containers.DELETE("/:id", handler.Delete)

		containers.POST("/:id/start", handler.Start)
		containers.POST("/:id/stop", handler.Stop)
		containers.POST("/:id/restart", handler.Restart)

		containers.GET("/:id/logs", handler.Logs)
		containers.GET("/:id/stats", handler.Stats)
		containers.POST("/:id/exec", handler.Exec)
	}
}
