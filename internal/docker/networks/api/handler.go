package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	mappers "github.com/rivernova/orcahub/internal/docker/networks/api/mappers"
	requests "github.com/rivernova/orcahub/internal/docker/networks/api/requests"
	domain "github.com/rivernova/orcahub/internal/docker/networks/domain"
	model "github.com/rivernova/orcahub/internal/docker/networks/model"
)

type Handler struct {
	service domain.NetworkService
}

func NewHandler(service domain.NetworkService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(c *gin.Context) {
	networks, err := h.service.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mappers.ToNetworkResponseList(networks))
}

func (h *Handler) Inspect(c *gin.Context) {
	id := c.Param("id")
	network, err := h.service.Inspect(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mappers.ToNetworkInspectResponse(network))
}

func (h *Handler) Create(c *gin.Context) {
	var req requests.CreateNetworkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	opts := model.CreateNetworkOptions{
		Name:       req.Name,
		Driver:     req.Driver,
		Internal:   req.Internal,
		Attachable: req.Attachable,
		Labels:     req.Labels,
		Options:    req.Options,
	}
	if req.IPAM != nil {
		pools := make([]model.IPAMPool, 0, len(req.IPAM.Config))
		for _, p := range req.IPAM.Config {
			pools = append(pools, model.IPAMPool{Subnet: p.Subnet, Gateway: p.Gateway})
		}
		opts.IPAM = &model.IPAM{Driver: req.IPAM.Driver, Config: pools}
	}
	result, err := h.service.Create(c.Request.Context(), opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, mappers.ToNetworkResponse(*result))
}

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *Handler) Connect(c *gin.Context) {
	id := c.Param("id")
	var req requests.ConnectContainerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.service.Connect(c.Request.Context(), id, model.ConnectOptions{
		ContainerID: req.ContainerID,
		IPv4Address: req.IPv4Address,
		Aliases:     req.Aliases,
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "container connected to network"})
}

func (h *Handler) Disconnect(c *gin.Context) {
	id := c.Param("id")
	var req requests.DisconnectContainerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.service.Disconnect(c.Request.Context(), id, model.DisconnectOptions{
		ContainerID: req.ContainerID,
		Force:       req.Force,
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "container disconnected from network"})
}
