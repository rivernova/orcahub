package router

import (
	"github.com/gin-gonic/gin"

	containerrouter "github.com/rivernova/orcahub/internal/docker/containers/api/router"
	imagerouter "github.com/rivernova/orcahub/internal/docker/images/api/router"
	networkrouter "github.com/rivernova/orcahub/internal/docker/networks/api/router"
	volumerouter "github.com/rivernova/orcahub/internal/docker/volumes/api/router"
	systemrouter "github.com/rivernova/orcahub/internal/system"

	containerapi "github.com/rivernova/orcahub/internal/docker/containers/api"
	imageapi "github.com/rivernova/orcahub/internal/docker/images/api"
	networkapi "github.com/rivernova/orcahub/internal/docker/networks/api"
	volumeapi "github.com/rivernova/orcahub/internal/docker/volumes/api"
	systemapi "github.com/rivernova/orcahub/internal/system"
)

type Handlers struct {
	//Docker
	Containers *containerapi.Handler
	Images     *imageapi.Handler
	Volumes    *volumeapi.Handler
	Networks   *networkapi.Handler

	//K8s

	System *systemapi.Handler
}

func SetupRouter(handlers *Handlers) *gin.Engine {
	r := gin.Default()

	// CORS for dev
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api")
	{
		systemrouter.Register(api.Group("/system"), handlers.System)

		docker := api.Group("/docker")
		{
			containerrouter.Register(docker, handlers.Containers)
			imagerouter.Register(docker, handlers.Images)
			volumerouter.Register(docker, handlers.Volumes)
			networkrouter.Register(docker, handlers.Networks)
		}
	}

	return r
}
