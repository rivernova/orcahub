package main

import (
	"log"
	"os"

	containeradapter "github.com/rivernova/orcahub/internal/docker/containers/adapter"
	containerapi "github.com/rivernova/orcahub/internal/docker/containers/api"
	containerdomain "github.com/rivernova/orcahub/internal/docker/containers/domain"

	imageadapter "github.com/rivernova/orcahub/internal/docker/images/adapter"
	imageapi "github.com/rivernova/orcahub/internal/docker/images/api"
	imagedomain "github.com/rivernova/orcahub/internal/docker/images/domain"

	volumeadapter "github.com/rivernova/orcahub/internal/docker/volumes/adapter"
	volumeapi "github.com/rivernova/orcahub/internal/docker/volumes/api"
	volumedomain "github.com/rivernova/orcahub/internal/docker/volumes/domain"

	networkadapter "github.com/rivernova/orcahub/internal/docker/networks/adapter"
	networkapi "github.com/rivernova/orcahub/internal/docker/networks/api"
	networkdomain "github.com/rivernova/orcahub/internal/docker/networks/domain"

	"github.com/rivernova/orcahub/internal/router"
)

func main() {
	// Containers
	containerAdapt, err := containeradapter.NewContainerAdapterImpl()
	if err != nil {
		log.Fatalf("failed to create container adapter: %v", err)
	}
	containerService := containerdomain.NewContainerServiceImpl(containerAdapt)
	containerHandler := containerapi.NewHandler(containerService)

	// Images
	imageAdapt, err := imageadapter.NewImageAdapterImpl()
	if err != nil {
		log.Fatalf("failed to create image adapter: %v", err)
	}
	imageService := imagedomain.NewImageServiceImpl(imageAdapt)
	imageHandler := imageapi.NewHandler(imageService)

	// Volumes
	volumeAdapt, err := volumeadapter.NewVolumeAdapterImpl()
	if err != nil {
		log.Fatalf("failed to create volume adapter: %v", err)
	}
	volumeService := volumedomain.NewVolumeServiceImpl(volumeAdapt)
	volumeHandler := volumeapi.NewHandler(volumeService)

	// Networks
	networkAdapt, err := networkadapter.NewNetworkAdapterImpl()
	if err != nil {
		log.Fatalf("failed to create network adapter: %v", err)
	}
	networkService := networkdomain.NewNetworkServiceImpl(networkAdapt)
	networkHandler := networkapi.NewHandler(networkService)

	r := router.SetupRouter(&router.Handlers{
		Containers: containerHandler,
		Images:     imageHandler,
		Volumes:    volumeHandler,
		Networks:   networkHandler,
	})

	port := getPort()

	log.Println("Starting OrcaHub server on :" + port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}

func getPort() string {
	if port := os.Getenv("ORCAHUB_PORT"); port != "" {
		return port
	}
	return "9876"
}
