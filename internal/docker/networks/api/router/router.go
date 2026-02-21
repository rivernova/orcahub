package router

import (
	"github.com/gin-gonic/gin"
	"github.com/rivernova/orcahub/internal/docker/networks/api"
)

func Register(rg *gin.RouterGroup, handler *api.Handler) {
	networks := rg.Group("/networks")
	{
		networks.GET("", handler.List)
		networks.GET("/:id", handler.Inspect)
		networks.POST("", handler.Create)
		networks.DELETE("/:id", handler.Delete)
		networks.POST("/:id/connect", handler.Connect)
		networks.POST("/:id/disconnect", handler.Disconnect)
	}
}
